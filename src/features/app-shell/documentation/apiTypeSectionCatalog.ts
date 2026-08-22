import { buildApiEndpointCatalog } from './apiEndpointCatalog';
import { buildApiTypeCatalog, type ApiTypeEntry } from './apiTypeCatalog';
import type { ApiEndpoint } from './apiEndpointTypes';
import {
  RETURNED_SECTION_ID,
  type ApiTypeReturn,
  type ApiTypeSection,
  type ApiTypeSectionEntry,
} from './apiTypeSectionTypes';

const MUTATING_METHODS = new Set(['POST', 'PUT']);
const FEATURE_ORDER = ['app-shell', 'asset-library', 'agents', 'game', 'infrastructure', 'app', 'scripts'];
const SPLIT_ABOVE = 60;
const MERGE_BELOW = 8;

let defaultSections: ApiTypeSection[] | null = null;

export function buildApiTypeSections(root: string = process.cwd()): ApiTypeSection[] {
  if (root === process.cwd() && defaultSections) return defaultSections;
  const entries = buildApiTypeCatalog(root);
  const returns = returnsByType(buildApiEndpointCatalog(root));
  const returned = entries
    .filter((entry) => returns.has(typeKey(entry)))
    .map((entry) => ({ ...entry, returnedBy: returns.get(typeKey(entry))! }))
    .sort(compareReturned);
  const rest = entries.filter((entry) => !returns.has(typeKey(entry))).map((entry) => ({ ...entry, returnedBy: [] }));
  const sections = [
    {
      id: RETURNED_SECTION_ID,
      title: 'Returned by POST and PUT',
      entries: returned,
    },
    ...ownerSections(rest),
  ];
  if (root === process.cwd()) defaultSections = sections;
  return sections;
}

function returnsByType(endpoints: ApiEndpoint[]): Map<string, ApiTypeReturn[]> {
  const returns = new Map<string, ApiTypeReturn[]>();
  for (const endpoint of endpoints) {
    if (!MUTATING_METHODS.has(endpoint.method)) continue;
    for (const output of endpoint.signature.outputs) {
      for (const type of output.types) {
        const key = `${type.file}:${type.name}`;
        const held = returns.get(key) ?? [];
        held.push({ method: endpoint.method, path: endpoint.path, status: output.status, through: type.through });
        returns.set(key, held);
      }
    }
  }
  return returns;
}

function compareReturned(left: ApiTypeSectionEntry, right: ApiTypeSectionEntry): number {
  return successCount(right) - successCount(left) || right.returnedBy.length - left.returnedBy.length;
}

function successCount(entry: ApiTypeSectionEntry): number {
  return new Set(entry.returnedBy.filter((use) => use.status < 400).map((use) => `${use.method} ${use.path}`)).size;
}

function ownerSections(entries: ApiTypeSectionEntry[]): ApiTypeSection[] {
  const byOwner = new Map<string, ApiTypeSectionEntry[]>();
  for (const entry of entries) {
    const owner = ownerOf(entry.file);
    byOwner.set(owner, [...(byOwner.get(owner) ?? []), entry]);
  }
  return [...byOwner.entries()]
    .sort(([left], [right]) => featureRank(left) - featureRank(right) || left.localeCompare(right))
    .flatMap(([owner, held]) => splitLarge(owner, held, ownerDepth(owner)));
}

function splitLarge(title: string, entries: ApiTypeSectionEntry[], depth: number): ApiTypeSection[] {
  if (entries.length <= SPLIT_ABOVE) return [section(title, entries)];
  const bySegment = new Map<string, ApiTypeSectionEntry[]>();
  const kept: ApiTypeSectionEntry[] = [];
  for (const entry of entries) {
    const segment = directorySegment(entry.file, depth);
    if (segment === null) kept.push(entry);
    else bySegment.set(segment, [...(bySegment.get(segment) ?? []), entry]);
  }
  const parts = [...bySegment.entries()].sort((left, right) => right[1].length - left[1].length);
  const sections: ApiTypeSection[] = [];
  for (const [segment, held] of parts) {
    if (held.length < MERGE_BELOW) kept.push(...held);
    else sections.push(...splitLarge(`${title} / ${segment}`, held, depth + 1));
  }
  return kept.length > 0 ? [section(title, kept), ...sections] : sections;
}

function section(title: string, entries: ApiTypeSectionEntry[]): ApiTypeSection {
  return { id: title.replace(/[^a-z0-9]+/gi, '-').toLowerCase(), title, entries };
}

function ownerOf(file: string): string {
  const parts = file.split('/');
  if (parts[0] === 'src' && parts[1] === 'features' && parts[2]) return parts[2];
  if (parts[0] === 'src' && parts[1]) return parts[1];
  return parts[0] ?? file;
}

function ownerDepth(owner: string): number {
  if (FEATURE_ORDER.indexOf(owner) < FEATURE_ORDER.indexOf('infrastructure')) return 3;
  return owner === 'scripts' ? 1 : 2;
}

function directorySegment(file: string, depth: number): string | null {
  const parts = file.split('/');
  return parts.length > depth + 1 ? parts[depth]! : null;
}

function featureRank(owner: string): number {
  const rank = FEATURE_ORDER.indexOf(owner);
  return rank === -1 ? FEATURE_ORDER.length : rank;
}

function typeKey(entry: ApiTypeEntry): string {
  return `${entry.file}:${entry.name}`;
}
