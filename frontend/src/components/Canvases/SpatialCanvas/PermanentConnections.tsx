import React from 'react';
import {
  CommandMenus,
  type BlockConnectionColor,
  type CanvasBlock,
} from '../../../state/types';
import { useModalStore } from '../../../state/useModalStore';
import { createConnectionKey } from '../../../state/useProjectStore';
import { routeConnection } from '../../../utils/orthogonalRouter';
import {
  getAnchorPoint,
  getArrowTipPoint,
  getBlockCanvasOrigin,
  RUNWAY_OFFSET,
} from './connectionLayerUtils';

interface PermanentConnectionsProps {
  blocks: CanvasBlock[];
  colorMap: Record<BlockConnectionColor, string>;
}

// Renders persisted connection lines and their interaction affordances.
const PermanentConnections: React.FC<PermanentConnectionsProps> = ({
  blocks,
  colorMap,
}) => {
  const { openMenu } = useModalStore();

  return (
    <>
      {blocks.flatMap((sourceBlock, index) => {
        const sourceOrigin = getBlockCanvasOrigin(sourceBlock, index);

        return (sourceBlock.connections ?? []).map((conn) => {
          const targetBlock = blocks.find(
            (block) => block.id === conn.targetId,
          );
          if (!targetBlock) return null;

          const lineColor = conn.color ? colorMap[conn.color] : '#3b82f6';
          const targetIndex = blocks.indexOf(targetBlock);
          const targetOrigin = getBlockCanvasOrigin(targetBlock, targetIndex);

          const start = getAnchorPoint(sourceOrigin, conn.sourceDir);
          const target = getAnchorPoint(targetOrigin, conn.targetDir);
          const tip = getArrowTipPoint(target, conn.targetDir);

          const connectionKey = createConnectionKey(
            sourceBlock.id,
            conn.targetId,
            conn.sourceDir,
            conn.targetDir,
          );

          const pathData = routeConnection(
            start,
            target,
            conn.sourceDir,
            conn.targetDir,
            blocks,
            sourceBlock.id,
            conn.targetId,
            RUNWAY_OFFSET,
            tip.x,
            tip.y,
          );

          return (
            <g
              key={connectionKey}
              data-connection-id={connectionKey}
              className="group/line cursor-pointer pointer-events-auto"
            >
              <path
                d={pathData}
                fill="none"
                stroke="transparent"
                strokeWidth="32"
                className="pointer-events-stroke cursor-pointer"
              />
              <path
                d={pathData}
                fill="none"
                style={{ stroke: lineColor }}
                strokeWidth="2"
                markerEnd={`url(#arrowhead-${conn.color ?? 'blue'})`}
                className="opacity-70 group-hover/line:opacity-100 transition-opacity duration-150 pointer-events-none"
              />
              <g
                className="pointer-events-auto"
                onClick={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                }}
                onContextMenu={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  openMenu(CommandMenus.ArrowCommand, {
                    top: event.clientY,
                    left: event.clientX,
                    arrowConnectionId: connectionKey,
                  });
                }}
              >
                <circle
                  cx={tip.x}
                  cy={tip.y}
                  r="16"
                  className="cursor-pointer"
                  fill="transparent"
                />
                <circle
                  cx={tip.x}
                  cy={tip.y}
                  r="16"
                  fill="none"
                  stroke="transparent"
                  strokeWidth="1.5"
                  style={{ strokeDasharray: '3 3' }}
                  className="group-hover/line:stroke-blue-500/50 group-hover/line:fill-blue-500/5 transition-all duration-150 pointer-events-none"
                />
              </g>
            </g>
          );
        });
      })}
    </>
  );
};

export default PermanentConnections;
