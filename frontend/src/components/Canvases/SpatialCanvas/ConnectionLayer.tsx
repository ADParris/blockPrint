// components/SpatialCanvas/SpatialConnectionLayer.tsx
import React from 'react';
import type { CanvasBlock } from '../../../state/types';

interface ConnectionLayerProps {
  blocks: CanvasBlock[];
  connectingFromId: string | null;
  connectingDirection: string | null;
  mouseCanvasPos: { x: number; y: number };
}

const ConnectionLayer: React.FC<ConnectionLayerProps> = ({
  blocks,
  connectingFromId,
  connectingDirection,
  mouseCanvasPos,
}) => {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="8"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
        </marker>
      </defs>

      {/* A. Permanent Dynamic Flowchart Connections */}
      {blocks.flatMap((sourceBlock, index) => {
        const sX = sourceBlock.position?.x ?? 100 + index * 20;
        const sY = sourceBlock.position?.y ?? 100 + index * 20;

        const sourceAnchors = {
          top: { x: sX + 128, y: sY - 2 },
          right: { x: sX + 256, y: sY + 40 },
          bottom: { x: sX + 128, y: sY + 82 },
          left: { x: sX, y: sY + 40 },
        };

        return (sourceBlock.connections ?? []).map((targetId: string) => {
          const targetBlock = blocks.find((b) => b.id === targetId);
          if (!targetBlock) return null;

          const tIndex = blocks.indexOf(targetBlock);
          const tX = targetBlock.position?.x ?? 100 + tIndex * 20;
          const tY = targetBlock.position?.y ?? 100 + tIndex * 20;

          const targetAnchors = {
            top: { x: tX + 128, y: tY - 2 },
            right: { x: tX + 256, y: tY + 40 },
            bottom: { x: tX + 128, y: tY + 82 },
            left: { x: tX, y: tY + 40 },
          };

          let bestSource = sourceAnchors.right;
          let bestTarget = targetAnchors.left;
          let minDistance = Infinity;

          Object.values(sourceAnchors).forEach((sPos) => {
            Object.values(targetAnchors).forEach((tPos) => {
              const dist = Math.hypot(tPos.x - sPos.x, tPos.y - sPos.y);
              if (dist < minDistance) {
                minDistance = dist;
                bestSource = sPos;
                bestTarget = tPos;
              }
            });
          });

          const controlOffset = Math.min(
            Math.abs(bestTarget.x - bestSource.x) * 0.5,
            100,
          );
          const isVertical = Math.abs(bestTarget.x - bestSource.x) < 40;

          const pathData = isVertical
            ? `M ${bestSource.x} ${bestSource.y} L ${bestTarget.x} ${bestTarget.y}`
            : `M ${bestSource.x} ${bestSource.y} C ${bestSource.x + (bestTarget.x > bestSource.x ? controlOffset : -controlOffset)} ${bestSource.y}, ${bestTarget.x + (bestTarget.x > bestSource.x ? -controlOffset : controlOffset)} ${bestTarget.y}, ${bestTarget.x} ${bestTarget.y}`;

          return (
            <g
              key={`${sourceBlock.id}-${targetId}`}
              className="group/line cursor-pointer pointer-events-auto"
              data-connection-id={`connection-${sourceBlock.id}-${targetId}`}
            >
              <path
                d={pathData}
                fill="none"
                stroke="transparent"
                strokeWidth="15"
              />
              <path
                d={pathData}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
                className="opacity-70 group-hover/line:opacity-100 group-hover/line:stroke-blue-400 transition-colors duration-150"
              />
            </g>
          );
        });
      })}

      {/* B. Live Drag-to-Connect Rigid Selection Lasso */}
      {connectingFromId &&
        connectingDirection &&
        (() => {
          const sourceBlock = blocks.find((b) => b.id === connectingFromId);
          if (!sourceBlock) return null;

          const sIndex = blocks.indexOf(sourceBlock);
          const sX = sourceBlock.position?.x ?? 100 + sIndex * 20;
          const sY = sourceBlock.position?.y ?? 100 + sIndex * 20;

          let startX = sX + 128;
          let startY = sY + 40;

          if (connectingDirection === 'top') {
            startX = sX + 128;
            startY = sY - 2;
          }
          if (connectingDirection === 'right') {
            startX = sX + 256;
            startY = sY + 40;
          }
          if (connectingDirection === 'bottom') {
            startX = sX + 128;
            startY = sY + 82;
          }
          if (connectingDirection === 'left') {
            startX = sX;
            startY = sY + 40;
          }

          const livePath = `M ${startX} ${startY} L ${mouseCanvasPos.x} ${mouseCanvasPos.y}`;

          return (
            <path
              d={livePath}
              fill="none"
              stroke="#60a5fa"
              strokeWidth="2.5"
              strokeDasharray="5 5"
            />
          );
        })()}
    </svg>
  );
};

export default ConnectionLayer;
