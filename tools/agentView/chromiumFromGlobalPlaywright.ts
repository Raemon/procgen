import { createRequire } from 'node:module';
import type { ServedResponse } from './servePublicFilesToPage';

interface RouteLike {
  request(): { url(): string };
  fulfill(response: ServedResponse): Promise<void>;
}

interface ConsoleMessageLike {
  type(): string;
  text(): string;
}

export interface PageLike {
  route(pattern: string, handler: (route: RouteLike) => unknown): Promise<void>;
  goto(url: string): Promise<unknown>;
  evaluate<Result, Argument>(
    body: (argument: Argument) => Promise<Result> | Result,
    argument: Argument,
  ): Promise<Result>;
  on(event: 'pageerror', handler: (error: Error) => void): void;
  on(event: 'console', handler: (message: ConsoleMessageLike) => void): void;
}

export interface BrowserLike {
  newPage(options: { viewport: { width: number; height: number } }): Promise<PageLike>;
  close(): Promise<void>;
}

export interface ChromiumLike {
  launch(options: { args: string[]; executablePath: string }): Promise<BrowserLike>;
}

export function chromiumFromGlobalPlaywright(): ChromiumLike {
  try {
    return createRequire(import.meta.url)('playwright').chromium as ChromiumLike;
  } catch {
    throw new Error('playwright not resolvable; run with NODE_PATH="$(npm root -g)"');
  }
}
