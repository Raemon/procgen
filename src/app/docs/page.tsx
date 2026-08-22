import { ApiEndpointDocumentation } from '@/features/app-shell/documentation/ApiEndpointDocumentation';
import { AppRouteDocumentation } from '@/features/app-shell/documentation/AppRouteDocumentation';
import { ApiTypeDocumentation } from '@/features/app-shell/documentation/ApiTypeDocumentation';
import { SourceDocumentation } from '@/features/app-shell/documentation/SourceDocumentation';

export default function ApiDocsPage() {
  return (
    <main className="min-h-full bg-bg p-6 text-ink">
      <div className="mx-auto max-w-[96rem]">
        <div className="mb-4 flex justify-end">
          <a className="text-xs text-accent underline underline-offset-4" href="/api/v1/openapi.json">
            OpenAPI JSON
          </a>
        </div>
        <div className="flex flex-wrap items-start gap-8">
          <ApiEndpointDocumentation />
          <ApiTypeDocumentation />
          <AppRouteDocumentation />
        </div>
      </div>
      <SourceDocumentation />
    </main>
  );
}
