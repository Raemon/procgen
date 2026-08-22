import './agentRoutes';
import '@/features/asset-library/worlds/api/worldLabRoutes';
import { allRoutes, type RouteSpec } from './routeRegistry';

export function everyRegisteredRoute(): RouteSpec[] {
  return allRoutes();
}
