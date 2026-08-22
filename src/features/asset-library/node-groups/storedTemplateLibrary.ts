import { sanitizeTemplates, type NodeTemplate } from './nodeTemplate';

export interface StoredTemplateLibrary {
  templates: NodeTemplate[];
  hiddenBuiltIns: string[];
}

export function templateLibraryFromStoredJson(raw: unknown): StoredTemplateLibrary {
  if (Array.isArray(raw)) return { templates: sanitizeTemplates(raw), hiddenBuiltIns: [] };
  const held = (raw ?? {}) as { templates?: unknown; hiddenBuiltIns?: unknown };
  return {
    templates: sanitizeTemplates(held.templates),
    hiddenBuiltIns: nameList(held.hiddenBuiltIns),
  };
}

function nameList(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((name): name is string => typeof name === 'string') : [];
}
