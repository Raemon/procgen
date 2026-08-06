import { useState } from 'react';
import { useAppRuntime } from '../../app/appRuntimeContext';
import { offsetsForAxisAmounts } from '../../latents/axisOffsets';
import type { LatentReport } from '../../latents/latentTypes';
import { Button } from '../controls/Button';
import { tooltipHandlers } from '../tooltips/tooltipHandlers';

const OFFSET_LIMIT = 0.4;

export function AxisOffsetSliders({ report }: { report: LatentReport }) {
  const { perform } = useAppRuntime();
  const [amounts, setAmounts] = useState<number[]>(() => report.axes.map(() => 0));

  const applyAmounts = (next: number[]) => {
    setAmounts(next);
    perform('set_latent_offsets', { offsets: Object.fromEntries(offsetsForAxisAmounts(report, next)) });
  };
  const reset = () => {
    setAmounts(report.axes.map(() => 0));
    perform('clear_latent_offsets');
  };

  return (
    <section className="flex flex-col gap-1.5">
      <SectionHeading
        title="A · push the world along an axis"
        tip="Adds amount × loading to every field node, then the pipeline re-derives everything downstream."
      />
      {report.axes.map((_axis, a) => (
        <label key={a} className="flex items-center gap-2">
          <span className="w-12 text-ink-dim">axis {a + 1}</span>
          <input
            type="range"
            className="flex-1"
            min={-OFFSET_LIMIT}
            max={OFFSET_LIMIT}
            step={0.01}
            value={amounts[a] ?? 0}
            onChange={(event) =>
              applyAmounts(amounts.map((held, i) => (i === a ? Number(event.target.value) : held)))
            }
          />
          <span className="w-10 text-right tabular-nums text-ink-dim">
            {(amounts[a] ?? 0).toFixed(2)}
          </span>
        </label>
      ))}
      <div>
        <Button onClick={reset}>reset offsets</Button>
      </div>
    </section>
  );
}

export function SectionHeading({ title, tip }: { title: string; tip: string }) {
  return (
    <h3
      className="cursor-help text-[11px] tracking-[0.1em] text-accent uppercase"
      {...tooltipHandlers({ title, body: tip })}
    >
      {title}
    </h3>
  );
}
