import { defaultCreatures } from '../src/creatures/defaultCreatures';
import { billboardFigureExtent } from '../src/creatures/character/billboardFigureExtent';
import { characterQuadFit } from '../src/views/view3d/characterQuadFit';

for (const def of defaultCreatures()) {
  if (!def.billboard) continue;
  const extent = billboardFigureExtent(def.billboard);
  const fit = characterQuadFit(def, def.billboard);
  console.log(def.name, JSON.stringify(extent), JSON.stringify(fit), 'aspect', (fit.quadWidth / fit.quadHeight).toFixed(3));
}
