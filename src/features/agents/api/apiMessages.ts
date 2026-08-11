import { failureByCode } from '../failures';

export interface ApiRequest {
  method: string;
  path: string;
  query: URLSearchParams;
  body: unknown;
}

export interface ApiResponse {
  status: number;
  contentType: string;
  body: string;
}

export function json(status: number, body: unknown): ApiResponse {
  return { status, contentType: 'application/json', body: JSON.stringify(body, null, 2) };
}

export function failure(status: number, code: string, hint: string): ApiResponse {
  const spec = failureByCode(code);
  return json(status, {
    error: code,
    meaning: spec?.meaning ?? code,
    recovery: spec?.recovery ?? 'See GET /api/v1/openapi.json.',
    hint,
  });
}
