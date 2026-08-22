import type { UnparsedDocument } from '@/features/app-shell/persistence/persistedDocumentContents';
import type { PersistedDocumentName } from '@/features/app-shell/persistence/persistedDocuments';
import type { DocumentRevision } from '@/infrastructure/server/persistence/docsRepo';

export const API_ERROR_CODES = [
  'not_found',
  'revision_required',
  'invalid_json',
  'invalid_resource',
  'stale_revision',
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export interface ApiErrorBody {
  error: { code: ApiErrorCode; message: string };
}

export interface PersistedDocumentBody<Name extends PersistedDocumentName> {
  data: UnparsedDocument<Name>;
  revision: DocumentRevision;
}
