import type { RenderedWorldView } from './browser/renderWorldViewInPage';
import {
  chromiumFromGlobalPlaywright,
  type BrowserLike,
  type PageLike,
} from './chromiumFromGlobalPlaywright';
import { PAGE_ORIGIN, servedResponseFor } from './servePublicFilesToPage';
import type { WorldViewRequest } from './worldViewRequest';

const CHROMIUM_EXECUTABLE = '/opt/pw-browsers/chromium';
const SOFTWARE_WEBGL_ARGS = [
  '--no-sandbox',
  '--use-gl=angle',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
];

export async function captureWorldViewPng(
  request: WorldViewRequest,
  bundle: string,
): Promise<RenderedWorldView> {
  const browser = await chromiumFromGlobalPlaywright().launch({
    args: SOFTWARE_WEBGL_ARGS,
    executablePath: process.env.CHROMIUM_EXECUTABLE_PATH ?? CHROMIUM_EXECUTABLE,
  });
  try {
    return await renderInFreshPage(browser, request, bundle);
  } finally {
    await browser.close();
  }
}

async function renderInFreshPage(
  browser: BrowserLike,
  request: WorldViewRequest,
  bundle: string,
): Promise<RenderedWorldView> {
  const page = await browser.newPage({
    viewport: { width: request.width, height: request.height },
  });
  reportPageProblems(page);
  await servePageFromRepo(page, bundle);
  await page.goto(`${PAGE_ORIGIN}/`);
  return page.evaluate((sent: WorldViewRequest) => window.renderWorldView(sent), request);
}

async function servePageFromRepo(page: PageLike, bundle: string): Promise<void> {
  await page.route(`${PAGE_ORIGIN}/**`, (route) =>
    route.fulfill(servedResponseFor(route.request().url(), bundle)),
  );
}

function reportPageProblems(page: PageLike): void {
  page.on('pageerror', (error) => console.error(`page error: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') console.error(`page console: ${message.text()}`);
  });
}
