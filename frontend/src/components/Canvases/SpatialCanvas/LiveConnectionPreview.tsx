import React from 'react';
import type {
  AnchorDirection,
  CanvasBlock,
  HoveredCanvasTarget,
  XYPosition,
} from '../../../state/types';
import { routeConnection } from '../../../utils/orthogonalRouter';
import {
  getAnchorPoint,
  getBlockCanvasOrigin,
  getHoveredAnchorPoint,
  inferTargetDirection,
  RUNWAY_OFFSET,
} from './connectionLayerUtils';

interface LiveConnectionPreviewProps {
  blocks: CanvasBlock[];
  connectingFromId: string;
  connectingDirection: AnchorDirection;
  hoveredTarget: HoveredCanvasTarget | null;
  pointerPos: XYPosition;
}

// Renders the temporary drag-to-connect lasso using the same router as saved links.
const LiveConnectionPreview: React.FC<LiveConnectionPreviewProps> = ({
  blocks,
  connectingFromId,
  connectingDirection,
  hoveredTarget,
  pointerPos,
}) => {
  const sourceBlock = blocks.find((block) => block.id === connectingFromId);
  if (!sourceBlock) return null;

  const sourceIndex = blocks.indexOf(sourceBlock);
  const sourceOrigin = getBlockCanvasOrigin(sourceBlock, sourceIndex);
  const start = getAnchorPoint(sourceOrigin, connectingDirection);

  const dx = pointerPos.x - start.x;
  const dy = pointerPos.y - start.y;

  const hoveredAnchor = getHoveredAnchorPoint(hoveredTarget, blocks);
  const target = hoveredAnchor ?? pointerPos;
  const targetDir = hoveredTarget
    ? hoveredTarget.direction
    : inferTargetDirection(dx, dy, connectingDirection);

  const livePath = routeConnection(
    start,
    target,
    connectingDirection,
    targetDir,
    blocks,
    connectingFromId,
    hoveredTarget?.blockId ?? '__live-target__',
    RUNWAY_OFFSET,
  );

  return (
    <path
      d={livePath}
      fill="none"
      stroke="#60a5fa"
      strokeWidth="2.5"
      strokeDasharray="5 5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="pointer-events-none"
    />
  );
};

export default LiveConnectionPreview;
