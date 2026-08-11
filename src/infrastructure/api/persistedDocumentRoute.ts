import type { PersistedDocumentName } from '@/features/app-shell/persistence/persistedDocuments';
import { persistedDocumentIsValid } from '@/features/app-shell/api/persistedDocumentValidation';
import { processServices } from '@/infrastructure/server/processServices';

export function persistedDocumentRoute(name: PersistedDocumentName) {
  return {
    GET: () => readDocument(name),
    PUT: (request: Request) => writeDocument(name, request),
  };
}

function readDocument(name: PersistedDocumentName): Response {
  const { docs } = processServices();
  const data = docs.read(name);
  if (data === null) return apiError(404, 'not_found', `${name} has not been seeded`);
  return documentResponse(data, docs.revision(name));
}

async function writeDocument(name: PersistedDocumentName, request: Request): Promise<Response> {
  const expected = expectedRevision(request);
  if (expected === null) return apiError(428, 'revision_required', 'send the current ETag in If-Match');
  const data = await jsonBody(request);
  if (data === INVALID_JSON) return apiError(400, 'invalid_json', 'request body must be JSON');
  if (!persistedDocumentIsValid(name, data)) {
    return apiError(422, 'invalid_resource', `${name} has the wrong JSON shape`);
  }
  const services = processServices();
  const revision = services.docs.writeIfCurrent(name, expected, data);
  if (revision === null) {
    return apiError(412, 'stale_revision', `current revision is ${services.docs.revision(name)}`);
  }
  services.documentChanged(name);
  return documentResponse(data, revision);
}

function expectedRevision(request: Request): string | null {
  const header = request.headers.get('if-match');
  if (header === null) return null;
  return header.replace(/^W\//, '').replace(/^"|"$/g, '');
}

const INVALID_JSON = Symbol('invalid json');

async function jsonBody(request: Request): Promise<unknown | typeof INVALID_JSON> {
  try {
    return await request.json();
  } catch {
    return INVALID_JSON;
  }
}

function documentResponse(data: unknown, revision: string): Response {
  return Response.json(
    { data, revision },
    {
      headers: {
        ETag: `"${revision}"`,
        'Cache-Control': 'no-store',
      },
    },
  );
}

function apiError(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message } }, { status });
}
