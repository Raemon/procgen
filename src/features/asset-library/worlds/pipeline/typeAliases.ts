export interface PipelineAliases {
  nodeTypes: Readonly<Record<string, string>>;
  params: Readonly<Record<string, Readonly<Record<string, string>>>>;
}

export const SHIPPED_ALIASES: PipelineAliases = {
  nodeTypes: { coastDistance: 'distanceToThreshold' },
  params: { distanceToThreshold: { seaLevel: 'level' } },
};

export function currentNodeType(aliases: PipelineAliases, storedType: string): string {
  return aliases.nodeTypes[storedType] ?? storedType;
}

export function storedParamValue(
  aliases: PipelineAliases,
  type: string,
  paramName: string,
  stored: Readonly<Record<string, unknown>>,
): unknown {
  if (stored[paramName] !== undefined) return stored[paramName];
  const formerName = formerNameOf(aliases.params[type], paramName);
  return formerName === undefined ? undefined : stored[formerName];
}

function formerNameOf(
  renames: Readonly<Record<string, string>> | undefined,
  paramName: string,
): string | undefined {
  return Object.keys(renames ?? {}).find((former) => renames![former] === paramName);
}
