import React from 'react';
import {
  type AnchorDirection,
  type BlockConnectionColor,
  type CanvasBlock,
} from '../../../state/types';
import { useProjectStore } from '../../../state/useProjectStore';
import LiveConnectionPreview from './LiveConnectionPreview';
import PermanentConnections from './PermanentConnections';
import {
  LIVE_POINTER_SETTLE_EPSILON,
  LIVE_POINTER_SMOOTHING,
} from './connectionLayerUtils';
import { useSmoothedCanvasPoint } from './useSmoothedCanvasPoint';

interface ConnectionLayerProps {
  blocks: CanvasBlock[];
  connectingFromId: string | null;
  connectingDirection: string | null;
  mouseCanvasPos: { x: number; y: number };
  onReconnectArrow?: (
    connectionId: string,
    clientX: number,
    clientY: number,
  ) => void;
}

const ConnectionLayer: React.FC<ConnectionLayerProps> = ({
  blocks,
  connectingFromId,
  connectingDirection,
  mouseCanvasPos,
}) => {
  // Global hover state tracks which anchor the lasso is currently over.
  const hoveredTarget = useProjectStore((state) => state.hoveredTarget);

  const isLiveConnecting = Boolean(connectingFromId && connectingDirection);
  const smoothedMouseCanvasPos = useSmoothedCanvasPoint({
    active: isLiveConnecting,
    targetPos: mouseCanvasPos,
    smoothing: LIVE_POINTER_SMOOTHING,
    settleEpsilon: LIVE_POINTER_SETTLE_EPSILON,
  });

  // Centralized color table keeps marker defs and path strokes in sync.
  const colorMap: Record<BlockConnectionColor, string> = {
    blue: '#3b82f6',
    emerald: '#10b981',
    rose: '#ef4444',
    amber: '#f59e0b',
  };

  return (
    <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
      <defs>
        {Object.entries(colorMap).map(([colorKey, hexValue]) => (
          <marker
            key={`arrowhead-${colorKey}`}
            id={`arrowhead-${colorKey}`}
            markerWidth="10"
            markerHeight="7"
            refX="8"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill={hexValue} />
          </marker>
        ))}
      </defs>

      {/* Persisted connections and controls */}
      <PermanentConnections blocks={blocks} colorMap={colorMap} />

      {/* Live preview path while dragging from a source anchor */}
      {connectingFromId && connectingDirection && (
        <LiveConnectionPreview
          blocks={blocks}
          connectingFromId={connectingFromId}
          connectingDirection={connectingDirection as AnchorDirection}
          hoveredTarget={hoveredTarget}
          pointerPos={smoothedMouseCanvasPos}
        />
      )}
    </svg>
  );
};

export default ConnectionLayer;
