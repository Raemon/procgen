import { openApiDocument } from '@/features/app-shell/api/openApiDocument';

export function GET() {
  return Response.json(openApiDocument(), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
