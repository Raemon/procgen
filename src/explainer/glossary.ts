export interface GlossaryEntry {
  definition: string;
  example: string;
}

export const GLOSSARY_DEFINITION_LIMIT = 80;
export const GLOSSARY_EXAMPLE_LIMIT = 300;

export const GLOSSARY: Record<string, GlossaryEntry> = {
  'latent variable': {
    definition: 'A hidden quantity you never measure, but which shapes many things you do.',
    example:
      'Nobody stores "elevation" as such. Yet ten of this world\'s fourteen fields rise and fall together, as if one hidden number were pulling all of them. That number is the latent variable: inferred from the chorus, never read off a single channel.',
  },
  channel: {
    definition: 'One measured column: what a single field node reads at every cell.',
    example:
      'The earthlike preset has fourteen enabled field nodes, so each cell carries fourteen numbers. Each of those columns is a channel. Their names are hidden from the inference, which sees only c0 through c13.',
  },
  'dimensionality reduction': {
    definition: 'Rewriting many correlated measurements as a few independent numbers.',
    example:
      'Fourteen channels per cell, but the cloud of cells is nearly flat: two or three numbers pin a cell down almost as well as all fourteen. Compressing 14 down to 3 with little loss is dimensionality reduction.',
  },
  covariance: {
    definition: 'How much two measurements wander away from their averages together.',
    example:
      'When "range belts" is above its average, "ranges in the belts" almost always is too: positive covariance. Drainage runs the other way — it falls as land rises — so its covariance with elevation-like channels is negative.',
  },
  'principal component analysis': {
    definition: 'Finding the directions along which a cloud of data is most stretched.',
    example:
      'Build the 14×14 covariance matrix, then ask which direction through channel-space the cells spread along most. That first direction turns out to be an elevation-like blend — discovered, not specified.',
  },
  eigenvector: {
    definition: 'A direction a matrix only stretches, never rotates; the axis of the cloud.',
    example:
      'The covariance matrix has eigenvectors. The one with the largest eigenvalue is the longest axis of the data cloud, and its eigenvalue is how much variance lies along it. Here the leading eigenvector is what we call axis 1.',
  },
  'power iteration': {
    definition: 'Finding the biggest eigenvector by multiplying a guess repeatedly.',
    example:
      'Start from an arbitrary direction, multiply it by the covariance matrix, renormalize, repeat sixty times. Each pass tilts the guess further toward the dominant axis. It needs no linear-algebra library — sixty lines of arithmetic.',
  },
  loading: {
    definition: 'How strongly one channel participates in one latent axis; a recipe weight.',
    example:
      'Axis 1 might be 0.31·c1 + 0.29·c4 + … − 0.02·c9. Those coefficients are the loadings. A big loading means the channel is a loud echo of that latent; near-zero means the channel is not really part of it.',
  },
  score: {
    definition: 'One cell\'s position along a latent axis, found by applying the recipe.',
    example:
      'Feed a cell\'s fourteen readings into the axis-1 recipe and out comes a single number: that cell\'s score. Loadings are per channel; scores are per cell. Ocean cells score near −1.00, ridge cells near +0.89.',
  },
  'explained variance': {
    definition: 'The share of the data\'s total wiggle that one axis accounts for.',
    example:
      'If axis 1 explains 60% of the variance, then more than half of everything that differs between cells, across all fourteen channels at once, is just that one hidden quantity varying from place to place.',
  },
  'rank normalization': {
    definition: 'Replacing each value by its position in the sorted order of that column.',
    example:
      'A field that is mostly near zero with a few huge spikes would dominate raw distances. Replace values by ranks in 0..1 and each channel gets an equal say — so drainage is not drowned out by elevation.',
  },
  quantile: {
    definition: 'The fraction of a distribution that falls below a given value.',
    example:
      'A cell at the 0.9 quantile of the elevation channel is higher than 90% of sampled cells. Steering re-measures a changed world against the original quantiles, so "the sea grew" is measured on a fixed ruler.',
  },
  'k-means': {
    definition: 'Sorting points into k groups, each hugging its own moving average.',
    example:
      'Guess seven centers, assign every cell to the nearest one, move each center to the mean of what it caught, repeat twenty times. The clusters that fall out here are sea, plains, uplands and the bands between.',
  },
  centroid: {
    definition: 'The average member of a cluster: its center of mass in channel-space.',
    example:
      'The sea cluster\'s centroid is a vector of fourteen numbers — its typical reading on every channel. A cell joins whichever centroid it sits nearest to, which is how a cell gets classified without any labels.',
  },
  contiguity: {
    definition: 'How much of a cluster forms one connected blob rather than confetti.',
    example:
      'The deep-basin cluster scores 0.94: almost every cell in it belongs to one connected body of water. A cluster scoring 0.12 is scattered speckle, which is evidence it is a texture rather than a landmass.',
  },
  blinding: {
    definition: 'Hiding the labels so a method cannot cheat by reading the answer.',
    example:
      'The panel shuffles channel order and never passes node names into the inference. Only after a name like "deep basin (sea?)" is committed can you unseal the key and find out that the channel really was tectonic uplift.',
  },
  intervention: {
    definition: 'Changing something on purpose to see what follows, instead of watching.',
    example:
      'Observing that elevation and drainage move together cannot say which drives which. Turning the uplift knob and watching drainage fall is an intervention, and it settles the direction of the arrow.',
  },
  jacobian: {
    definition: 'A table of how much each output shifts when each input is nudged.',
    example:
      'Fifty knobs by ten measured latents gives a 10×50 table. Reading down the axis-1 column shows landHeight at 6.15 and plateSize at 5.95 — the two knobs that own elevation, recovered without reading their names.',
  },
  'finite difference': {
    definition: 'Estimating a derivative by nudging an input and dividing the change.',
    example:
      'Raise plateSize by 12% of its range, re-evaluate a small window, and see the deep-basin share drop. Divide the drop by the nudge and you have an estimate of the slope without any calculus on the source.',
  },
  pseudoinverse: {
    definition: 'The best available undo for a matrix that cannot be properly inverted.',
    example:
      'Fifty knobs and ten targets means many knob settings achieve the same goal. The pseudoinverse picks the smallest such combination — the gentlest set of turns that moves the target you asked for.',
  },
  'ridge regularization': {
    definition: 'Adding a small penalty so a fit prefers modest, stable answers.',
    example:
      'When two knobs do almost the same thing, the solver can swing one wildly positive and the other wildly negative. A ridge term forbids that, keeping the applied turns small and the world recognizable.',
  },
  identifiability: {
    definition: 'Whether the data can pin down a latent uniquely, or only up to a rotation.',
    example:
      'Axis 1 flipped in sign describes the same data equally well, so "high is up" is a convention, not a discovery. Factor solutions are identified only up to rotation and sign, which is why the names carry question marks.',
  },
  confounding: {
    definition: 'When a shared hidden cause makes two effects look causally linked.',
    example:
      'Coast distance and steepness correlate, but neither causes the other — elevation drives both. Mistaking that for a direct link is confounding, and it is exactly what intervention protects you from.',
  },
  ablation: {
    definition: 'Deleting a part to learn what depended on it, by seeing what breaks.',
    example:
      'Disable the node behind one sealed channel, re-run inference, and see which other channels go flat. What collapses together was downstream of it — a causal skeleton recovered without ever unsealing a label.',
  },
};
