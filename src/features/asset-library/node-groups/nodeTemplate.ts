import { sanitizePipeline } from '@/features/asset-library/worlds/pipeline/sanitizePipeline';
import type { NodeInstance } from '@/features/asset-library/worlds/pipeline/pipelineState';

export interface NodeTemplate {
  name: string;
  description: string;
  nodes: NodeInstance[];
}

export function sanitizeTemplate(raw: unknown): NodeTemplate | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const candidate = raw as { name?: unknown; description?: unknown; nodes?: unknown };
  if (typeof candidate.name !== 'string' || candidate.name.trim() === '') return null;
  const nodes = sanitizePipeline({ nodes: candidate.nodes }).nodes;
  if (nodes.length === 0) return null;
  return {
    name: candidate.name.trim(),
    description: typeof candidate.description === 'string' ? candidate.description : '',
    nodes,
  };
}

export function sanitizeTemplates(raw: unknown): NodeTemplate[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(sanitizeTemplate).filter((template): template is NodeTemplate => template !== null);
}
