import { sourceFileResponse } from '@/features/app-shell/documentation/sourceCatalog';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return sourceFileResponse((await params).id);
}
