import React from 'react';
import { createConnectionKey } from '../../../state/canvasSlice'; // 🎯 Linked to your centralized key utility
import type { CanvasBlock } from '../../../state/types';
import { CommandMenu } from '../../../state/types';
import { useModalStore } from '../../../state/useModalStore';

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
  const { openMenu } = useModalStore();

  // 🎯 DYNAMIC ORTHOGONAL ROUTER
  const calculateOrthogonalPath = (
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    sourceDir: string,
    targetDir: string,
  ) => {
    const offset = 40; // Clearance runway away from the blocks

    if (sourceDir === 'bottom') {
      if (targetDir === 'bottom') {
        const lowestY = Math.max(startY, endY) + offset;
        return [
          `M ${startX} ${startY}`,
          `L ${startX} ${lowestY}`,
          `L ${endX} ${lowestY}`,
          `L ${endX} ${endY}`,
        ].join(' ');
      }

      const midY = startY + (endY - startY) / 2;
      return [
        `M ${startX} ${startY}`,
        `L ${startX} ${midY}`,
        `L ${endX} ${midY}`,
        `L ${endX} ${endY}`,
      ].join(' ');
    }

    if (sourceDir === 'top') {
      if (targetDir === 'top') {
        const highestY = Math.min(startY, endY) - offset;
        return [
          `M ${startX} ${startY}`,
          `L ${startX} ${highestY}`,
          `L ${endX} ${highestY}`,
          `L ${endX} ${endY}`,
        ].join(' ');
      }

      const midY = startY + (endY - startY) / 2;
      return [
        `M ${startX} ${startY}`,
        `L ${startX} ${midY}`,
        `L ${endX} ${midY}`,
        `L ${endX} ${endY}`,
      ].join(' ');
    }

    if (sourceDir === 'right') {
      if (targetDir === 'right') {
        const furthestX = Math.max(startX, endX) + offset;
        return [
          `M ${startX} ${startY}`,
          `L ${furthestX} ${startY}`,
          `L ${furthestX} ${endY}`,
          `L ${endX} ${endY}`,
        ].join(' ');
      }

      const midX = startX + (endX - startX) / 2;
      return [
        `M ${startX} ${startY}`,
        `L ${midX} ${startY}`,
        `L ${midX} ${endY}`,
        `L ${endX} ${endY}`,
      ].join(' ');
    }

    if (sourceDir === 'left') {
      if (targetDir === 'left') {
        const furthestX = Math.min(startX, endX) - offset;
        return [
          `M ${startX} ${startY}`,
          `L ${furthestX} ${startY}`,
          `L ${furthestX} ${endY}`,
          `L ${endX} ${endY}`,
        ].join(' ');
      }

      const midX = startX + (endX - startX) / 2;
      return [
        `M ${startX} ${startY}`,
        `L ${midX} ${startY}`,
        `L ${midX} ${endY}`,
        `L ${endX} ${endY}`,
      ].join(' ');
    }

    return `M ${startX} ${startY} L ${endX} ${endY}`;
  };

  return (
    <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
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

      {/* Permanent Flowchart Connections */}
      {blocks.flatMap((sourceBlock, index) => {
        const sX = sourceBlock.position?.x ?? 100 + index * 20;
        const sY = sourceBlock.position?.y ?? 100 + index * 20;

        return (sourceBlock.connections ?? []).map((conn) => {
          const targetBlock = blocks.find((b) => b.id === conn.targetId);
          if (!targetBlock) return null;

          const tIndex = blocks.indexOf(targetBlock);
          const tX = targetBlock.position?.x ?? 100 + tIndex * 20;
          const tY = targetBlock.position?.y ?? 100 + tIndex * 20;

          // 🎯 FIX: Pass all four exact structural pieces to create the accurate system tracking key
          const connectionKey = createConnectionKey(
            sourceBlock.id,
            conn.targetId,
            conn.sourceDir,
            conn.targetDir,
          );

          // =========================================================================
          // SECTION 1: SOURCE DEPARTURE PORT COORDINATES
          // Maps coordinates directly from explicit metadata.
          // =========================================================================
          let startX = sX + 128; // Center horizontally
          let startY = sY; // Baseline default: Top edge

          if (conn.sourceDir === 'top') {
            startY = sY; // Flush with top edge
          } else if (conn.sourceDir === 'bottom') {
            startY = sY + 80 - 8; // Flush with bottom edge
          } else if (conn.sourceDir === 'right') {
            startX = sX + 256; // Flush with right edge
            startY = sY + 40;
          } else if (conn.sourceDir === 'left') {
            startX = sX; // Flush with left edge
            startY = sY + 40;
          }

          // =========================================================================
          // SECTION 2: TARGET ARRIVAL LANDING COORDINATES
          // Seats arrow right on the perimeter borders of the target block
          // =========================================================================
          let targetX = tX + 128;
          let targetY = tY + 40;

          if (conn.targetDir === 'top') {
            targetX = tX + 128;
            targetY = tY - 8; // 🎯 Back off 8px above the top border
          } else if (conn.targetDir === 'bottom') {
            targetX = tX + 128;
            targetY = tY + 80 + 2; // 🎯 Back off 8px below the bottom border (88px total)
          } else if (conn.targetDir === 'left') {
            targetX = tX - 8; // 🎯 Back off 8px to the left of the card face
            targetY = tY + 40;
          } else if (conn.targetDir === 'right') {
            targetX = tX + 256 + 8; // 🎯 Back off 8px to the right of the card face (264px total)
            targetY = tY + 40;
          }

          // =========================================================================
          // SECTION 3: PATH ROUTER CALCULATION
          // =========================================================================
          const pathData = calculateOrthogonalPath(
            startX,
            startY,
            targetX,
            targetY,
            conn.sourceDir,
            conn.targetDir,
          );

          return (
            <g
              key={connectionKey}
              className="group/line cursor-pointer pointer-events-auto"
            >
              {/* Invisible Line Hover Hitbox */}
              <path
                d={pathData}
                fill="none"
                stroke="transparent"
                strokeWidth="32"
                className="pointer-events-stroke cursor-pointer"
              />

              {/* Visible Vector Line */}
              <path
                d={pathData}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
                className="opacity-70 group-hover/line:opacity-100 group-hover/line:stroke-blue-400 transition-colors duration-150 pointer-events-none"
              />

              {/* Arrowhead / Click Interceptor */}
              <g
                className="pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  console.log(`Connection selected: ${connectionKey}`);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openMenu(CommandMenu.ArrowCommand, {
                    top: e.clientY,
                    left: e.clientX,
                    arrowConnectionId: connectionKey,
                  });
                }}
              >
                <circle
                  cx={targetX}
                  cy={targetY}
                  r="16"
                  fill="transparent"
                  className="cursor-pointer"
                />

                <circle
                  cx={targetX}
                  cy={targetY}
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

      {/* Live Drag-to-Connect Adaptive Selection Lasso */}
      {connectingFromId &&
        connectingDirection &&
        (() => {
          const sourceBlock = blocks.find((b) => b.id === connectingFromId);
          if (!sourceBlock) return null;

          const sIndex = blocks.indexOf(sourceBlock);
          const sX = sourceBlock.position?.x ?? 100 + sIndex * 20;
          const sY = sourceBlock.position?.y ?? 100 + sIndex * 20;

          let startX = sX + 128;
          let startY = sY + 80;

          if (connectingDirection === 'top') {
            startX = sX + 128;
            startY = sY;
          } else if (connectingDirection === 'right') {
            startX = sX + 256;
            startY = sY + 40;
          } else if (connectingDirection === 'left') {
            startX = sX;
            startY = sY + 40;
          }

          // 🎯 FIX: Determine a dynamic target face based on mouse position relative to start
          let liveTargetDir = 'top';
          if (connectingDirection === 'bottom') {
            // If we are dragging down, expect to land on a bottom or top face smoothly
            liveTargetDir = mouseCanvasPos.y > startY ? 'top' : 'bottom';
          } else if (connectingDirection === 'right') {
            liveTargetDir = mouseCanvasPos.x > startX ? 'left' : 'right';
          } else if (connectingDirection === 'left') {
            liveTargetDir = mouseCanvasPos.x < startX ? 'right' : 'left';
          }

          const runwayClearance = 40; // Force the line out by 40px before branching
          let livePath: string;

          if (connectingDirection === 'bottom') {
            const dropY = startY + runwayClearance;
            livePath = [
              `M ${startX} ${startY}`,
              `L ${startX} ${dropY}`, // 1. Force straight down out of the block floor
              `L ${mouseCanvasPos.x} ${dropY}`, // 2. Slide horizontally to match mouse X
              `L ${mouseCanvasPos.x} ${mouseCanvasPos.y}`, // 3. Head straight to mouse pointer
            ].join(' ');
          } else if (connectingDirection === 'top') {
            const liftY = startY - runwayClearance;
            livePath = [
              `M ${startX} ${startY}`,
              `L ${startX} ${liftY}`, // 1. Force straight up out of the roof
              `L ${mouseCanvasPos.x} ${liftY}`, // 2. Slide horizontally
              `L ${mouseCanvasPos.x} ${mouseCanvasPos.y}`,
            ].join(' ');
          } else if (connectingDirection === 'right') {
            const pushX = startX + runwayClearance;
            livePath = [
              `M ${startX} ${startY}`,
              `L ${pushX} ${startY}`, // 1. Force straight out right wall
              `L ${pushX} ${mouseCanvasPos.y}`, // 2. Drop or climb vertically
              `L ${mouseCanvasPos.x} ${mouseCanvasPos.y}`,
            ].join(' ');
          } else if (connectingDirection === 'left') {
            const pushX = startX - runwayClearance;
            livePath = [
              `M ${startX} ${startY}`,
              `L ${pushX} ${startY}`, // 1. Force straight out left wall
              `L ${pushX} ${mouseCanvasPos.y}`, // 2. Drop or climb vertically
              `L ${mouseCanvasPos.x} ${mouseCanvasPos.y}`,
            ].join(' ');
          } else {
            // Fallback to router if direction is missing
            livePath = calculateOrthogonalPath(
              startX,
              startY,
              mouseCanvasPos.x,
              mouseCanvasPos.y,
              connectingDirection,
              liveTargetDir,
            );
          }

          return (
            <path
              d={livePath}
              fill="none"
              stroke="#60a5fa"
              strokeWidth="2.5"
              strokeDasharray="5 5"
              className="pointer-events-none"
            />
          );
        })()}
    </svg>
  );
};

export default ConnectionLayer;
