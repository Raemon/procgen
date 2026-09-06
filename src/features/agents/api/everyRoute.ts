import './agentRoutes';
import '@/features/asset-library/worlds/api/worldSeedLabRoutes';
import '@/features/asset-library/worlds/api/worldBuildRoutes';
import { allRoutes, type RouteSpec } from './routeRegistry';

export function everyRegisteredRoute(): RouteSpec[] {
  return allRoutes();
}
