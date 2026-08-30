import type { CSSProperties } from 'react';

const CHECKER_SQUARES =
  'linear-gradient(45deg, #2b2b2b 25%, transparent 25%, transparent 75%, #2b2b2b 75%)';

export function transparencyCheckerStyle(squarePx: number): CSSProperties {
  return {
    backgroundImage: `${CHECKER_SQUARES}, ${CHECKER_SQUARES}`,
    backgroundSize: `${squarePx}px ${squarePx}px`,
    backgroundPosition: `0 0, ${squarePx / 2}px ${squarePx / 2}px`,
    backgroundColor: '#1e1e1e',
  };
}
