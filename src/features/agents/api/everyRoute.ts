import './agentRoutes';
import { allRoutes, type RouteSpec } from './routeRegistry';

export function everyRegisteredRoute(): RouteSpec[] {
  return allRoutes();
}
