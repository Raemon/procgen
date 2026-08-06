import { FloatingTooltip } from '../ui/tooltips/FloatingTooltip';
import { GlossaryIndex } from './GlossaryIndex';
import { Jargon } from './Jargon';

export function ExplainerPage() {
  return (
    <>
      <main className="mx-auto max-w-[46rem] px-6 py-12 text-[15px] leading-[1.75] text-ink-dim">
        <PageHeader />
        <TheTable />
        <TheSquash />
        <TheNaming />
        <TheSliders />
        <TheLimits />
        <GlossaryIndex />
      </main>
      <FloatingTooltip />
    </>
  );
}

function PageHeader() {
  return (
    <header className="mb-10 border-b border-panel-edge pb-6">
      <h1 className="text-[28px] leading-tight font-semibold text-ink">
        What the latents panel is actually doing
      </h1>
      <p className="mt-2">
        Every underlined term has a definition and a worked example on hover — or on keyboard focus.
        Everything below describes machinery that runs in this repo, on numbers taken from the
        <span className="text-ink"> earthlike coasts &amp; ranges </span> preset.
      </p>
    </header>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-9">
      <h2 className="mb-2 text-[13px] tracking-[0.14em] text-accent uppercase">{title}</h2>
      {children}
    </section>
  );
}

function TheTable() {
  return (
    <Section title="1 · the table">
      <p className="mb-3">
        Start with what the panel samples: a big table. One row per cell of the world — 36,864 of
        them — and one column per <Jargon term="channel" />, one column for each enabled field node.
        In this preset there are fourteen. Each cell is therefore a point in fourteen-dimensional
        space, its coordinates being <em>what did c0 read here, what did c1 read here</em>, and so on.
      </p>
      <p>
        Crucially the panel is <Jargon term="blinding">blinded</Jargon>: channel order is shuffled and
        node names never reach the inference. It sees c0…c13 and nothing else. Only after it commits
        to a name can you unseal the key and see whether it was right.
      </p>
    </Section>
  );
}

function TheSquash() {
  return (
    <Section title="2 · the squash">
      <p className="mb-3">
        That cloud of 36,864 points does not fill fourteen-dimensional space. It is squashed nearly
        flat. When one channel runs high, ten others almost always run high too — they have strong{' '}
        <Jargon term="covariance" />. So although fourteen numbers were measured, two or three pin a
        cell down almost as well. That gap is <Jargon term="dimensionality reduction" />, and the few
        numbers doing the work are the <Jargon term="latent variable">latent variables</Jargon>.
      </p>
      <p className="mb-3">
        The classic analogy: fourteen thermometers around one room. Each reads differently — drafts,
        sunlight, cheap sensors — but one hidden number, the room&apos;s temperature, drives them all.
        You never measure it directly; you infer it from the chorus.
      </p>
      <p>
        <Jargon term="principal component analysis" /> finds the directions along which the cloud is
        most stretched, by taking the leading <Jargon term="eigenvector">eigenvectors</Jargon> of the
        covariance matrix via <Jargon term="power iteration" />. Each axis comes with{' '}
        <Jargon term="loading">loadings</Jargon> (a per-channel recipe), a per-cell{' '}
        <Jargon term="score" />, and an <Jargon term="explained variance" /> share. Before any of it,
        every channel is put on equal footing by <Jargon term="rank normalization" /> — otherwise one
        spiky field would shout down the rest.
      </p>
    </Section>
  );
}

function TheNaming() {
  return (
    <Section title="3 · the naming">
      <p className="mb-3">
        Continuous axes are one kind of latent; categories are another. <Jargon term="k-means" />{' '}
        sorts cells into groups, each hugging its own <Jargon term="centroid" />. The panel then
        describes each group by its shape alone: what share of the map it covers, its{' '}
        <Jargon term="contiguity" />, how much of it is boundary, and which groups it touches.
      </p>
      <p className="mb-3">
        Names come from those shapes and nothing else. Large, connected, lowest on axis 1 →{' '}
        <span className="text-ink">deep basin (sea?)</span>. Highest → <span className="text-ink">high
        ground (uplands?)</span>. Thin bands bridging the two →{' '}
        <span className="text-ink">coastline</span>. On this preset the blind read was 30% deep basin
        at contiguity 0.94, 17% open country, 16% high ground — before ever seeing a label.
      </p>
      <p>
        The question marks are not decoration. Latents are only{' '}
        <Jargon term="identifiability">identified</Jargon> up to rotation and sign, so which end of an
        axis is &ldquo;up&rdquo; is a convention. The panel names shapes, and shapes are suggestive,
        not conclusive.
      </p>
    </Section>
  );
}

function TheSliders() {
  return (
    <Section title="4 · the two sliders">
      <p className="mb-3">
        A latent is a description of outputs, not a knob of the generator, so a slider has to be
        given a mechanism. There are two honest ones, and the panel ships both.
      </p>
      <p className="mb-3">
        <span className="text-ink">Mechanism A — push the world along an axis.</span> Add{' '}
        <em>amount × loading</em> to every field node, right inside the evaluator. Because the world
        is re-derived from its causes on demand, everything downstream recomputes: offsetting the
        plates field alone moved nine other fields, and drainage <em>fell</em> as the land rose. It is
        instant and cheap, but it edits effects coherently rather than touching causes.
      </p>
      <p className="mb-3">
        <span className="text-ink">Mechanism B — steer the causes.</span> The true causes are the
        pipeline&apos;s knobs. Nudge each one, re-measure the latents against a frozen ruler of
        baseline <Jargon term="quantile">quantiles</Jargon>, and divide: a{' '}
        <Jargon term="finite difference" /> estimate of every knob&apos;s effect on every latent. That
        whole table is the <Jargon term="jacobian" />. Ask for more of one latent and the{' '}
        <Jargon term="pseudoinverse" />, tamed by <Jargon term="ridge regularization" />, finds the
        gentlest combination of turns that delivers it.
      </p>
      <p>
        Mechanism B is an <Jargon term="intervention" />, and that is the point:{' '}
        <Jargon term="covariance">correlation</Jargon> alone cannot say whether elevation drives
        drainage or the reverse. Turning a knob and watching what follows can.
      </p>
    </Section>
  );
}

function TheLimits() {
  return (
    <Section title="5 · what it cannot tell you">
      <p className="mb-3">
        PCA and k-means find covariation, not mechanism. They can report that ten channels share a
        hidden factor; they cannot report that uplift causes erosion. Where two effects share an
        upstream cause — coast distance and steepness, say — treating their correlation as a direct
        link is plain <Jargon term="confounding" />.
      </p>
      <p>
        The strongest available upgrade is <Jargon term="ablation" />: disable the node behind one
        sealed channel, re-run the inference, and record what collapses with it. Repeat per channel
        and a causal skeleton falls out, still without unsealing a single name. That is the natural
        next rung, and it is not built yet.
      </p>
    </Section>
  );
}
