import { PanelHint } from '../../frontend/help/PanelHint';
import { PresetsRow } from '../../procgen/panel/PresetsRow';
import { RandomizeRow } from '../../procgen/panel/RandomizeRow';
import { WorldDaylightRow } from '../../procgen/panel/WorldDaylightRow';
import { WorldSeedRow } from '../../procgen/panel/WorldSeedRow';

export function WorldDetail() {
  return (
    <>
      <WorldSeedRow />
      <WorldDaylightRow />
      <PresetsRow />
      <RandomizeRow />
      <PanelHint className="mt-2">
        The settings the whole pipeline runs under. Same seed and same nodes always generate the
        same world; a preset stores every node, wire and knob under a name, and the rolls throw new
        combinations at you when you want a starting point rather than a plan.
      </PanelHint>
    </>
  );
}
