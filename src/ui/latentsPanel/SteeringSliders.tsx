import { useState } from 'react';
import type { KnobJacobian } from '../../latents/knobJacobian';
import type { LatentReport } from '../../latents/latentTypes';
import { statisticLabels } from '../../latents/worldStatistics';
import { Button } from '../controls/Button';
import { tooltipHandlers } from '../tooltips/tooltipHandlers';
import { SectionHeading } from './AxisOffsetSliders';
import { useKnobSteering } from './useKnobSteering';

const STEER_STEP = 0.02;

export function SteeringSliders({ report }: { report: LatentReport }) {
  const { state, calibrate, steer } = useKnobSteering();
  const [lastMove, setLastMove] = useState<string | null>(null);
  return (
    <section className="flex flex-col gap-1.5">
      <SectionHeading
        title="B · steer the causes"
        tip="Measures how each pipeline knob moves each latent, then turns the knobs that move your target most and everything else least."
      />
      {state.status !== 'ready' && (
        <div>
          <Button onClick={() => calibrate(report)}>
            {state.status === 'calibrating'
              ? `calibrating ${state.progress.done}/${state.progress.total}…`
              : 'calibrate knobs'}
          </Button>
        </div>
      )}
      {state.status === 'ready' && (
        <SteerRows
          report={report}
          jacobian={state.jacobian}
          onSteer={(index, amount) => setLastMove(describeMove(report, index, amount, steer(state.jacobian, index, amount)))}
        />
      )}
      {lastMove && <p className="text-ink-dim">{lastMove}</p>}
    </section>
  );
}

function SteerRows({
  report,
  jacobian,
  onSteer,
}: {
  report: LatentReport;
  jacobian: KnobJacobian;
  onSteer(index: number, amount: number): void;
}) {
  const labels = statisticLabels(report);
  return (
    <>
      <p className="text-ink-dim">{jacobian.knobs.length} knobs calibrated</p>
      {labels.map((label, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <span
            className="flex-1 cursor-help truncate"
            {...tooltipHandlers({ title: label, body: strongestKnobsFor(jacobian, index) })}
          >
            {label}
          </span>
          <Button onClick={() => onSteer(index, -STEER_STEP)}>−</Button>
          <Button onClick={() => onSteer(index, STEER_STEP)}>+</Button>
        </div>
      ))}
    </>
  );
}

function strongestKnobsFor(jacobian: KnobJacobian, index: number): string {
  const ranked = jacobian.columns
    .map((column, k) => ({ knob: jacobian.knobs[k]!, sensitivity: column[index] ?? 0 }))
    .sort((a, b) => Math.abs(b.sensitivity) - Math.abs(a.sensitivity))
    .slice(0, 3)
    .map(({ knob, sensitivity }) => `${knob.nodeId}.${knob.param} ${sensitivity.toFixed(2)}`);
  return `moved most by: ${ranked.join(', ')}`;
}

function describeMove(
  report: LatentReport,
  index: number,
  amount: number,
  turned: number,
): string {
  const label = statisticLabels(report)[index] ?? 'target';
  return `${amount > 0 ? 'raised' : 'lowered'} ${label} by turning ${turned} knob(s) — rerun inference to remeasure`;
}
