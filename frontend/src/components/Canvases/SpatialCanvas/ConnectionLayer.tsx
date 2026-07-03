import React from 'react';
import {
  CommandMenus,
  type BlockConnectionColor,
  type CanvasBlock,
} from '../../../state/types';
import { useModalStore } from '../../../state/useModalStore';
import { createConnectionKey } from '../../../state/useProjectStore';

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
  const { openMenu } = useModalStore();

  const colorMap: Record<BlockConnectionColor, string> = {
    blue: '#3b82f6',
    emerald: '#10b981',
    rose: '#ef4444',
    amber: '#f59e0b',
  };

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
        {/* 🎨 Fully Automated Marker Generation */}
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

      {/* Permanent Flowchart Connections */}
      {blocks.flatMap((sourceBlock, index) => {
        const sX = sourceBlock.position?.x ?? 100 + index * 20;
        const sY = sourceBlock.position?.y ?? 100 + index * 20;

        return (sourceBlock.connections ?? []).map((conn) => {
          const targetBlock = blocks.find((b) => b.id === conn.targetId);
          if (!targetBlock) return null;

          const lineColor = conn.color ? colorMap[conn.color] : '#3b82f6';

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
          // SECTION 1: SOURCE DEPARTURE PORT COORDINATES (Updated for 256x128 cards)
          // =========================================================================
          let startX = sX + 128; // Center horizontally (256 / 2)
          let startY = sY; // Baseline default: Top edge

          if (conn.sourceDir === 'top') {
            startY = sY;
          } else if (conn.sourceDir === 'bottom') {
            startY = sY + 128; // 🎯 Flush with the actual bottom edge (128px)
          } else if (conn.sourceDir === 'right') {
            startX = sX + 256; // Flush with right edge (256px)
            startY = sY + 64; // 🎯 Vertically centered (128 / 2)
          } else if (conn.sourceDir === 'left') {
            startX = sX;
            startY = sY + 64; // 🎯 Vertically centered (128 / 2)
          }

          // =========================================================================
          // SECTION 2: TARGET ARRIVAL LANDING COORDINATES (Updated for 256x128 cards)
          // =========================================================================
          let targetX = tX + 128;
          let targetY = tY + 64; // Default centered fallback

          if (conn.targetDir === 'top') {
            targetX = tX + 128;
            targetY = tY - 12; // 🎯 Top connecting point (-12 to back off of the card)
          } else if (conn.targetDir === 'bottom') {
            targetX = tX + 128;
            targetY = tY + 128 + 12; // 🎯 Bottom connecting point (+12 to back off of the card)
          } else if (conn.targetDir === 'left') {
            targetX = tX - 12; // 🎯 Left connecting point (-12 to back off of the card)
            targetY = tY + 64;
          } else if (conn.targetDir === 'right') {
            targetX = tX + 256 + 12; // 🎯 Right connecting point (+12 to back off of the card)
            targetY = tY + 64;
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
              data-connection-id={connectionKey}
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
                style={{
                  stroke: lineColor,
                }}
                strokeWidth="2" // 💪 Scaled up from 2 for a crisp, solid look
                markerEnd={`url(#arrowhead-${conn.color ?? 'blue'})`}
                className="opacity-70 group-hover/line:opacity-100 transition-opacity duration-150 pointer-events-none"
              />

              {/* Arrowhead / Click Interceptor */}
              <g
                className="pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openMenu(CommandMenus.ArrowCommand, {
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
          // 🎯 Pull coordinates directly from state to match the permanent connection lines perfectly
          const sX = sourceBlock.position?.x ?? 100 + sIndex * 20;
          const sY = sourceBlock.position?.y ?? 100 + sIndex * 20;

          // 🎯 1. Match the exact 256x128 bounding metrics of your permanent lines
          let startX = sX + 128;
          let startY = sY;

          if (connectingDirection === 'top') {
            startX = sX + 128;
            startY = sY;
          } else if (connectingDirection === 'right') {
            startX = sX + 256;
            startY = sY + 64;
          } else if (connectingDirection === 'left') {
            startX = sX;
            startY = sY + 64;
          } else if (connectingDirection === 'bottom') {
            startX = sX + 128;
            startY = sY + 128; // 🎯 Flush with the actual bottom edge
          }

          // 2. 🎯 AXIS-LOCKED ADAPTIVE LASSO ROUTER (With Persistent Arc Retention)
          let livePath = `M ${startX} ${startY}`;
          const dx = mouseCanvasPos.x - startX;
          const dy = mouseCanvasPos.y - startY;
          const threshold = 40;

          if (connectingDirection === 'left') {
            if (dx < -threshold || Math.abs(dy) > threshold) {
              livePath = `M ${startX} ${startY} L ${startX - threshold} ${startY} L ${startX - threshold} ${mouseCanvasPos.y} L ${mouseCanvasPos.x} ${mouseCanvasPos.y}`;
            } else {
              livePath = `M ${startX} ${startY} L ${mouseCanvasPos.x} ${startY} L ${mouseCanvasPos.x} ${mouseCanvasPos.y}`;
            }
          } else if (connectingDirection === 'right') {
            if (dx > threshold || Math.abs(dy) > threshold) {
              livePath = `M ${startX} ${startY} L ${startX + threshold} ${startY} L ${startX + threshold} ${mouseCanvasPos.y} L ${mouseCanvasPos.x} ${mouseCanvasPos.y}`;
            } else {
              livePath = `M ${startX} ${startY} L ${mouseCanvasPos.x} ${startY} L ${mouseCanvasPos.x} ${mouseCanvasPos.y}`;
            }
          } else if (connectingDirection === 'top') {
            if (dy < -threshold || Math.abs(dx) > threshold) {
              livePath = `M ${startX} ${startY} L ${startX} ${startY - threshold} L ${mouseCanvasPos.x} ${startY - threshold} L ${mouseCanvasPos.x} ${mouseCanvasPos.y}`;
            } else {
              livePath = `M ${startX} ${startY} L ${startX} ${mouseCanvasPos.y} L ${mouseCanvasPos.x} ${mouseCanvasPos.y}`;
            }
          } else if (connectingDirection === 'bottom') {
            if (dy > threshold || Math.abs(dx) > threshold) {
              livePath = `M ${startX} ${startY} L ${startX} ${startY + threshold} L ${mouseCanvasPos.x} ${startY + threshold} L ${mouseCanvasPos.x} ${mouseCanvasPos.y}`;
            } else {
              livePath = `M ${startX} ${startY} L ${startX} ${mouseCanvasPos.y} L ${mouseCanvasPos.x} ${mouseCanvasPos.y}`;
            }
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
