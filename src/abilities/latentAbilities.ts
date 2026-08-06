import { abilityFailed, abilitySucceeded, type AbilityResult, type AbilitySpec } from './ability';
import { registerAbility } from './abilityRegistry';

function registerLatentAbility(spec: Omit<AbilitySpec, 'mode' | 'group' | 'changesWorld'>): AbilitySpec {
  return registerAbility({ ...spec, mode: 'god', group: 'world', changesWorld: true });
}

registerLatentAbility({
  action: 'set_latent_offsets',
  humanControl: 'latents panel: mechanism A axis sliders',
  description:
    'Add a constant to every cell of the named field nodes, so a whole discovered latent axis shifts at once. Nodes downstream re-derive from the shifted values, so rivers, biomes and towns follow.',
  params: {
    offsets: {
      kind: 'json',
      help: 'an object of node id to the amount added to every cell of that field, e.g. {"n1": 0.08}',
    },
  },
  example: { action: 'set_latent_offsets', offsets: { n1: 0.08 } },
  apply: (context, params) => {
    const offsets = readOffsets(params.offsets);
    if (!offsets.ok) return offsets.failure;
    const unknown = [...offsets.value.keys()].filter((nodeId) => !context.store.nodeById(nodeId));
    if (unknown.length > 0) return abilityFailed('unknown_node', `no node(s): ${unknown.join(', ')}`);
    context.fieldOffsets.replaceAll(offsets.value);
    return abilitySucceeded(`offset ${offsets.value.size} field node(s)`);
  },
});

registerLatentAbility({
  action: 'clear_latent_offsets',
  humanControl: 'latents panel: reset offsets button',
  description: 'Remove every latent axis offset, returning fields to what the pipeline alone produces.',
  params: {},
  example: { action: 'clear_latent_offsets' },
  apply: (context) => {
    context.fieldOffsets.clear();
    return abilitySucceeded('latent offsets cleared');
  },
});

type OffsetsRead =
  | { ok: true; value: Map<string, number> }
  | { ok: false; failure: AbilityResult };

function readOffsets(raw: unknown): OffsetsRead {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, failure: abilityFailed('invalid_value', "'offsets' takes an object of node id to number") };
  }
  const value = new Map<string, number>();
  for (const [nodeId, amount] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      return { ok: false, failure: abilityFailed('invalid_value', `offset for '${nodeId}' must be a number`) };
    }
    value.set(nodeId, amount);
  }
  return { ok: true, value };
}
