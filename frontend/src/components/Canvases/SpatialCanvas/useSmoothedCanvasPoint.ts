import React from 'react';
import type { XYPosition } from '../../../state/types';

interface UseSmoothedCanvasPointArgs {
  active: boolean;
  targetPos: XYPosition;
  smoothing: number;
  settleEpsilon: number;
}

// Eases pointer movement for live lasso rendering without changing final coordinates.
export function useSmoothedCanvasPoint({
  active,
  targetPos,
  smoothing,
  settleEpsilon,
}: UseSmoothedCanvasPointArgs): XYPosition {
  const [smoothedPos, setSmoothedPos] = React.useState<XYPosition>(targetPos);

  React.useEffect(() => {
    if (!active) return;

    let rafId = 0;

    const animate = () => {
      setSmoothedPos((previous) => {
        const nextX = previous.x + (targetPos.x - previous.x) * smoothing;
        const nextY = previous.y + (targetPos.y - previous.y) * smoothing;

        const settledX = Math.abs(nextX - targetPos.x) <= settleEpsilon;
        const settledY = Math.abs(nextY - targetPos.y) <= settleEpsilon;

        if (settledX && settledY) {
          return targetPos;
        }

        rafId = requestAnimationFrame(animate);
        return { x: nextX, y: nextY };
      });
    };

    rafId = requestAnimationFrame(animate);
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [active, settleEpsilon, smoothing, targetPos]);

  return active ? smoothedPos : targetPos;
}
