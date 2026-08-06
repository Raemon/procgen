import { useState } from 'react';
import type { LatentReport, NamedCluster } from '../../latents/latentTypes';
import { Button } from '../controls/Button';
import { AxisOffsetSliders } from './AxisOffsetSliders';
import { CLUSTER_COLORS, LatentMiniMap } from './LatentMiniMap';
import { SteeringSliders } from './SteeringSliders';
import type { LatentInferenceState } from './useLatentInference';
import { useLatentInference } from './useLatentInference';

export function LatentsPanel() {
  const { state, run } = useLatentInference();
  return (
    <div className="flex flex-col gap-2 text-xs">
      <p className="text-ink-dim">
        Reads every enabled field node with its labels sealed away, then tries to rediscover — and
        name in English — the world&apos;s latent structure from the numbers alone.
      </p>
      <div className="flex items-center gap-1.5">
        <Button onClick={run}>{state.status === 'running' ? 'running…' : 'infer latents'}</Button>
        <a
          href="/explainer.html"
          target="_blank"
          rel="noreferrer"
          className="text-ink-dim underline hover:text-ink"
        >
          what is a latent variable?
        </a>
      </div>
      <StateBody state={state} />
    </div>
  );
}

function StateBody({ state }: { state: LatentInferenceState }) {
  if (state.status === 'idle') return <p className="text-ink-dim">no inference run yet</p>;
  if (state.status === 'running') {
    return (
      <p className="text-ink-dim">
        {state.progress.phase} {state.progress.done}/{state.progress.total}
      </p>
    );
  }
  return <ReportBody report={state.report} stale={state.stale} />;
}

function ReportBody({ report, stale }: { report: LatentReport; stale: boolean }) {
  if (report.clusters.length === 0) {
    return <p className="text-ink-dim">no enabled field nodes to read — add some to the pipeline</p>;
  }
  return (
    <div className="flex flex-col gap-2.5">
      {stale && <p className="text-ink-dim">the pipeline changed since this run — rerun to refresh</p>}
      <LatentMiniMap report={report} />
      <AxesSummary report={report} />
      {sortedByShare(report.clusters).map(({ cluster, index }) => (
        <ClusterCard key={index} cluster={cluster} index={index} />
      ))}
      <AxisOffsetSliders report={report} />
      <SteeringSliders report={report} />
      <RevealChannels labels={report.sealedChannelLabels} />
    </div>
  );
}

function sortedByShare(clusters: NamedCluster[]): { cluster: NamedCluster; index: number }[] {
  return clusters
    .map((cluster, index) => ({ cluster, index }))
    .sort((a, b) => b.cluster.share - a.cluster.share);
}

function AxesSummary({ report }: { report: LatentReport }) {
  return (
    <p className="text-ink-dim">
      {report.sealedChannelLabels.length} sealed channels ·{' '}
      {report.axes
        .map((axis, i) => `axis ${i + 1}: ${Math.round(axis.varianceShare * 100)}%`)
        .join(' · ')}
    </p>
  );
}

function ClusterCard({ cluster, index }: { cluster: NamedCluster; index: number }) {
  return (
    <div className="rounded border border-panel-edge p-2">
      <p>
        <span style={{ color: CLUSTER_COLORS[index % CLUSTER_COLORS.length] }}>█</span>{' '}
        <span className="text-ink">{cluster.name}</span>
      </p>
      <p className="text-ink-dim">{cluster.evidence}</p>
    </div>
  );
}

function RevealChannels({ labels }: { labels: string[] }) {
  const [revealed, setRevealed] = useState(false);
  if (!revealed) {
    return (
      <div>
        <Button onClick={() => setRevealed(true)}>reveal sealed channel labels</Button>
      </div>
    );
  }
  return (
    <div className="rounded border border-panel-edge p-2 text-ink-dim">
      {labels.map((label, i) => (
        <p key={i}>
          c{i} = {label}
        </p>
      ))}
    </div>
  );
}
