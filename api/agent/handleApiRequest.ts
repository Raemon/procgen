import '../docs/docsRoute';
import './catalogRoutes';
import './agentRoutes';
import { failure, type ApiRequest, type ApiResponse } from './apiMessages';
import { methodsAllowedFor, routeFor } from './routeRegistry';
import type { WorldAccess } from './serverWorld';
import type { SessionStore } from './sessions';

export function handleApiRequest(
  sessions: SessionStore,
  access: WorldAccess,
  req: ApiRequest,
): ApiResponse {
  const match = routeFor(req.method, req.path);
  if (match) return match.spec.handle({ sessions, access, req, params: match.params });
  const allowed = methodsAllowedFor(req.path);
  if (allowed.length > 0) {
    return failure(405, 'bad_request', `use ${allowed.join(' or ')} on ${req.path}`);
  }
  return failure(404, 'bad_request', `no route for ${req.method} ${req.path}`);
}
