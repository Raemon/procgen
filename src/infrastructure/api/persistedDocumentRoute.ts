import {
  DEFAULTED_DOCUMENT_NAMES,
  type DefaultedDocumentName,
  type PersistedDocumentName,
} from '@/features/app-shell/persistence/persistedDocuments';
import { parseDefaultedDocument } from '@/features/app-shell/persistence/parsePersistedDocument';
import {
  unparsedDocument,
  type UnparsedDocument,
} from '@/features/app-shell/persistence/persistedDocumentContents';
import {
  type ApiErrorBody,
  type ApiErrorCode,
  type PersistedDocumentBody,
} from '@/features/app-shell/api/persistedDocumentResponses';
import { persistedDocumentIsValid } from '@/features/app-shell/api/persistedDocumentValidation';
import { processServices } from '@/infrastructure/server/processServices';
import type { DocumentRevision } from '@/infrastructure/server/persistence/docsRepo';

export interface PersistedDocumentHandlers {
  GET(): Response;
  PUT(request: Request): Promise<Response>;
}

export function persistedDocumentRoute(name: PersistedDocumentName): PersistedDocumentHandlers {
  return {
    GET: () => readDocument(name),
    PUT: (request: Request) => writeDocument(name, request),
  };
}

function readDocument<Name extends PersistedDocumentName>(name: Name): Response {
  const { docs } = processServices();
  const data = docs.read(name) ?? emptyDocument(name);
  if (data === null) return apiError(404, 'not_found', `${name} has not been seeded`);
  return documentResponse(data, docs.revision(name));
}

function emptyDocument<Name extends PersistedDocumentName>(
  name: Name,
): UnparsedDocument<Name> | null {
  if (!isDefaultedDocument(name)) return null;
  return unparsedDocument(parseDefaultedDocument(name, null));
}

function isDefaultedDocument(name: PersistedDocumentName): name is DefaultedDocumentName {
  return (DEFAULTED_DOCUMENT_NAMES as readonly string[]).includes(name);
}

async function writeDocument<Name extends PersistedDocumentName>(
  name: Name,
  request: Request,
): Promise<Response> {
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

function expectedRevision(request: Request): DocumentRevision | null {
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

function documentResponse<Name extends PersistedDocumentName>(
  data: UnparsedDocument<Name>,
  revision: DocumentRevision,
): Response {
  return Response.json({ data, revision } satisfies PersistedDocumentBody<Name>, {
    headers: {
      ETag: `"${revision}"`,
      'Cache-Control': 'no-store',
    },
  });
}

function apiError(status: number, code: ApiErrorCode, message: string): Response {
  return Response.json({ error: { code, message } } satisfies ApiErrorBody, { status });
}
