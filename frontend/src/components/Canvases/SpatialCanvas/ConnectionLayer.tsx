import React from 'react';
import {
  CommandMenus,
  type BlockConnectionColor,
  type CanvasBlock,
} from '../../../state/types';
import { useModalStore } from '../../../state/useModalStore';
import {
  createConnectionKey,
  useProjectStore,
} from '../../../state/useProjectStore';

// 🚀 UNIFIED RUNWAY CLEARANCE CONSTANT
const RUNWAY_OFFSET = 50;

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
  const hoveredTarget = useProjectStore((state) => state.hoveredTarget);
  const { openMenu } = useModalStore();

  const colorMap: Record<BlockConnectionColor, string> = {
    blue: '#3b82f6',
    emerald: '#10b981',
    rose: '#ef4444',
    amber: '#f59e0b',
  };

  // 🎯 DYNAMIC ORTHOGONAL ROUTER (Fully Balanced Bidirectional Pairs)
  const calculateOrthogonalPath = (
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    sourceDir: string,
    targetDir: string,
    tipX?: number,
    tipY?: number,
  ) => {
    const runwayX = tipX !== undefined ? tipX : endX;
    const runwayY = tipY !== undefined ? tipY : endY;
    // ==========================================
    // 1. SOURCE IS BOTTOM
    // ==========================================
    if (sourceDir === 'bottom') {
      if (targetDir === 'bottom') {
        const lowestY = Math.max(startY + RUNWAY_OFFSET, endY);
        return [
          `M ${startX} ${startY}`,
          `L ${startX} ${lowestY}`, // Both lines will now align perfectly here
          `L ${endX} ${lowestY}`,
          `L ${runwayX} ${runwayY}`,
        ].join(' ');
      }

      // 🎯 Bottom Source to Side Target (Left/Right)
      if (targetDir === 'left' || targetDir === 'right') {
        if (endY > startY) {
          return [
            `M ${startX} ${startY}`,
            `L ${startX} ${endY}`,
            `L ${runwayX} ${runwayY}`,
          ].join(' ');
        }
        const departureY = startY + RUNWAY_OFFSET;
        const clearanceX =
          targetDir === 'left' ? endX - RUNWAY_OFFSET : endX + RUNWAY_OFFSET;
        return [
          `M ${startX} ${startY}`,
          `L ${startX} ${departureY}`,
          `L ${clearanceX} ${departureY}`,
          `L ${clearanceX} ${endY}`,
          `L ${runwayX} ${runwayY}`,
        ].join(' ');
      }

      const departureY = startY + RUNWAY_OFFSET;
      const midY = departureY + (endY - departureY) / 2;
      return [
        `M ${startX} ${startY}`,
        `L ${startX} ${departureY}`, // Drops cleanly past the card edge uniformly
        `L ${startX} ${midY}`,
        `L ${endX} ${midY}`,
        `L ${runwayX} ${runwayY}`,
      ].join(' ');
    }

    // ==========================================
    // 2. SOURCE IS TOP
    // ==========================================
    if (sourceDir === 'top') {
      if (targetDir === 'top') {
        const highestY = Math.min(startY, endY) - RUNWAY_OFFSET;
        return [
          `M ${startX} ${startY}`,
          `L ${startX} ${highestY}`,
          `L ${endX} ${highestY}`,
          `L ${runwayX} ${runwayY}`,
        ].join(' ');
      }

      // 🎯 Top Source to Side Target (Left/Right)
      if (targetDir === 'left' || targetDir === 'right') {
        if (endY < startY) {
          return [
            `M ${startX} ${startY}`,
            `L ${startX} ${endY}`,
            `L ${runwayX} ${runwayY}`,
          ].join(' ');
        }
        const departureY = startY - RUNWAY_OFFSET;
        const clearanceX =
          targetDir === 'left' ? endX - RUNWAY_OFFSET : endX + RUNWAY_OFFSET;
        return [
          `M ${startX} ${startY}`,
          `L ${startX} ${departureY}`,
          `L ${clearanceX} ${departureY}`,
          `L ${clearanceX} ${endY}`,
          `L ${runwayX} ${runwayY}`,
        ].join(' ');
      }

      const midY = startY + (endY - startY) / 2;
      return [
        `M ${startX} ${startY}`,
        `L ${startX} ${midY}`,
        `L ${endX} ${midY}`,
        `L ${runwayX} ${runwayY}`,
      ].join(' ');
    }

    // ==========================================
    // 3. SOURCE IS RIGHT
    // ==========================================
    if (sourceDir === 'right') {
      if (targetDir === 'right') {
        const furthestX = Math.max(startX, endX) + RUNWAY_OFFSET;
        return [
          `M ${startX} ${startY}`,
          `L ${furthestX} ${startY}`,
          `L ${furthestX} ${endY}`,
          `L ${runwayX} ${runwayY}`,
        ].join(' ');
      }

      // 🎯 Side-to-Top
      if (targetDir === 'top') {
        if (endX > startX && endY > startY) {
          const cardBottomY = startY + 64;
          const sharedTrackY = cardBottomY + RUNWAY_OFFSET;
          return [
            `M ${startX} ${startY}`,
            `L ${startX + RUNWAY_OFFSET} ${startY}`,
            `L ${startX + RUNWAY_OFFSET} ${sharedTrackY}`,
            `L ${endX} ${sharedTrackY}`,
            `L ${runwayX} ${runwayY}`,
          ].join(' ');
        }
        const departureX = startX + RUNWAY_OFFSET;
        const overheadY = endY - RUNWAY_OFFSET;
        return [
          `M ${startX} ${startY}`,
          `L ${departureX} ${startY}`,
          `L ${departureX} ${overheadY}`,
          `L ${endX} ${overheadY}`,
          `L ${runwayX} ${runwayY}`,
        ].join(' ');
      }

      // 🎯 Side-to-Bottom
      if (targetDir === 'bottom') {
        if (endX > startX && endY < startY) {
          return [
            `M ${startX} ${startY}`,
            `L ${endX} ${startY}`,
            `L ${runwayX} ${runwayY}`,
          ].join(' ');
        }
        const departureX = startX + RUNWAY_OFFSET;
        const underY = endY + RUNWAY_OFFSET;
        return [
          `M ${startX} ${startY}`,
          `L ${departureX} ${startY}`,
          `L ${departureX} ${underY}`,
          `L ${endX} ${underY}`,
          `L ${runwayX} ${runwayY}`,
        ].join(' ');
      }

      const midX = startX + (endX - startX) / 2;
      return [
        `M ${startX} ${startY}`,
        `L ${midX} ${startY}`,
        `L ${midX} ${endY}`,
        `L ${runwayX} ${runwayY}`,
      ].join(' ');
    }

    // ==========================================
    // 4. SOURCE IS LEFT
    // ==========================================
    if (sourceDir === 'left') {
      if (targetDir === 'left') {
        const furthestX = Math.min(startX, endX) - RUNWAY_OFFSET;
        return [
          `M ${startX} ${startY}`,
          `L ${furthestX} ${startY}`,
          `L ${furthestX} ${endY}`,
          `L ${runwayX} ${runwayY}`,
        ].join(' ');
      }

      // 🎯 Side-to-Top
      if (targetDir === 'top') {
        if (endX < startX && endY > startY) {
          const cardBottomY = startY + 64;
          const sharedTrackY = cardBottomY + RUNWAY_OFFSET;
          return [
            `M ${startX} ${startY}`,
            `L ${startX - RUNWAY_OFFSET} ${startY}`,
            `L ${startX - RUNWAY_OFFSET} ${sharedTrackY}`,
            `L ${endX} ${sharedTrackY}`,
            `L ${runwayX} ${runwayY}`,
          ].join(' ');
        }
        const departureX = startX - RUNWAY_OFFSET;
        const overheadY = endY - RUNWAY_OFFSET;
        return [
          `M ${startX} ${startY}`,
          `L ${departureX} ${startY}`,
          `L ${departureX} ${overheadY}`,
          `L ${endX} ${overheadY}`,
          `L ${runwayX} ${runwayY}`,
        ].join(' ');
      }

      // 🎯 Side-to-Bottom
      if (targetDir === 'bottom') {
        if (endX < startX && endY < startY) {
          return [
            `M ${startX} ${startY}`,
            `L ${endX} ${startY}`,
            `L ${runwayX} ${runwayY}`,
          ].join(' ');
        }
        const departureX = startX - RUNWAY_OFFSET;
        const underY = endY + RUNWAY_OFFSET;
        return [
          `M ${startX} ${startY}`,
          `L ${departureX} ${startY}`,
          `L ${departureX} ${underY}`,
          `L ${endX} ${underY}`,
          `L ${runwayX} ${runwayY}`,
        ].join(' ');
      }

      const midX = startX + (endX - startX) / 2;
      return [
        `M ${startX} ${startY}`,
        `L ${midX} ${startY}`,
        `L ${midX} ${endY}`,
        `L ${runwayX} ${runwayY}`,
      ].join(' ');
    }

    return `M ${startX} ${startY} L ${runwayX} ${runwayY}`;
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

          const connectionKey = createConnectionKey(
            sourceBlock.id,
            conn.targetId,
            conn.sourceDir,
            conn.targetDir,
          );

          let startX = sX + 128;
          let startY = sY;

          if (conn.sourceDir === 'top') {
            startY = sY;
          } else if (conn.sourceDir === 'bottom') {
            startY = sY + 128;
          } else if (conn.sourceDir === 'right') {
            startX = sX + 256;
            startY = sY + 64;
          } else if (conn.sourceDir === 'left') {
            startX = sX;
            startY = sY + 64;
          }

          // 1. Clean card-edge coordinates for track alignment
          let targetX = tX + 128;
          let targetY = tY + 64;

          if (conn.targetDir === 'top') {
            targetX = tX + 128;
            targetY = tY;
          } else if (conn.targetDir === 'bottom') {
            targetX = tX + 128;
            targetY = tY + 128;
          } else if (conn.targetDir === 'left') {
            targetX = tX;
            targetY = tY + 64;
          } else if (conn.targetDir === 'right') {
            targetX = tX + 256;
            targetY = tY + 64;
          }

          // 2. Beautiful arrowhead tip coordinates with back-off clearance
          let tipX = targetX;
          let tipY = targetY;
          if (conn.targetDir === 'top') tipY -= 18;
          else if (conn.targetDir === 'bottom') tipY += 18;
          else if (conn.targetDir === 'left') tipX -= 18;
          else if (conn.targetDir === 'right') tipX += 18;

          // 3. Generate the path using clean bounds for lanes, but tip bounds for the arrow
          const pathData = calculateOrthogonalPath(
            startX,
            startY,
            targetX,
            targetY,
            conn.sourceDir,
            conn.targetDir,
            tipX,
            tipY,
          );

          // 3. Calculate separate adjusted anchor points ONLY for the visual arrowhead rings/gaps
          let anchorX = targetX;
          let anchorY = targetY;
          if (conn.targetDir === 'top') anchorY -= 18;
          else if (conn.targetDir === 'bottom') anchorY += 18;
          else if (conn.targetDir === 'left') anchorX -= 18;
          else if (conn.targetDir === 'right') anchorX += 18;

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
                style={{
                  stroke: lineColor,
                }}
                strokeWidth="2"
                markerEnd={`url(#arrowhead-${conn.color ?? 'blue'})`}
                className="opacity-70 group-hover/line:opacity-100 transition-opacity duration-150 pointer-events-none"
              />
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
                  cx={anchorX}
                  cy={anchorY}
                  r="16"
                  className="cursor-pointer"
                  fill="transparent"
                />
                <circle
                  cx={anchorX}
                  cy={anchorY}
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
            startY = sY + 128;
          }

          let livePath = `M ${startX} ${startY}`;
          const dx = mouseCanvasPos.x - startX;
          const dy = mouseCanvasPos.y - startY;

          if (connectingDirection === 'top') {
            if (hoveredTarget) {
              if (hoveredTarget.direction === 'bottom') {
                const midY = startY + dy / 2;
                livePath = [
                  `M ${startX} ${startY}`,
                  `L ${startX} ${midY}`,
                  `L ${mouseCanvasPos.x} ${midY}`,
                  `L ${mouseCanvasPos.x} ${mouseCanvasPos.y}`,
                ].join(' ');
              } else if (hoveredTarget.direction === 'top') {
                const targetMaxClearance = 48;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const dynamicClearance = Math.min(targetMaxClearance, distance);
                const highestY =
                  Math.min(startY, mouseCanvasPos.y) - dynamicClearance;

                livePath = [
                  `M ${startX} ${startY}`,
                  `L ${startX} ${highestY}`,
                  `L ${mouseCanvasPos.x} ${highestY}`,
                  `L ${mouseCanvasPos.x} ${mouseCanvasPos.y}`,
                ].join(' ');
              } else if (
                hoveredTarget.direction === 'left' ||
                hoveredTarget.direction === 'right'
              ) {
                if (mouseCanvasPos.y < startY) {
                  livePath = [
                    `M ${startX} ${startY}`,
                    `L ${startX} ${mouseCanvasPos.y}`,
                    `L ${mouseCanvasPos.x} ${mouseCanvasPos.y}`,
                  ].join(' ');
                } else {
                  const departureY = startY - RUNWAY_OFFSET;
                  const clearanceX =
                    hoveredTarget.direction === 'left'
                      ? mouseCanvasPos.x - RUNWAY_OFFSET
                      : mouseCanvasPos.x + RUNWAY_OFFSET;
                  livePath = [
                    `M ${startX} ${startY}`,
                    `L ${startX} ${departureY}`,
                    `L ${clearanceX} ${departureY}`,
                    `L ${clearanceX} ${mouseCanvasPos.y}`,
                    `L ${mouseCanvasPos.x} ${mouseCanvasPos.y}`,
                  ].join(' ');
                }
              } else {
                livePath = [
                  `M ${startX} ${startY}`,
                  `L ${startX} ${mouseCanvasPos.y}`,
                  `L ${mouseCanvasPos.x} ${mouseCanvasPos.y}`,
                ].join(' ');
              }
            } else {
              livePath = [
                `M ${startX} ${startY}`,
                `L ${startX} ${mouseCanvasPos.y}`,
                `L ${mouseCanvasPos.x} ${mouseCanvasPos.y}`,
              ].join(' ');
            }
          } else if (connectingDirection === 'bottom') {
            if (hoveredTarget) {
              if (hoveredTarget.direction === 'top') {
                const midY = startY + dy / 2;
                livePath = [
                  `M ${startX} ${startY}`,
                  `L ${startX} ${midY}`,
                  `L ${mouseCanvasPos.x} ${midY}`,
                  `L ${mouseCanvasPos.x} ${mouseCanvasPos.y}`,
                ].join(' ');
              } else if (hoveredTarget.direction === 'bottom') {
                const targetMaxClearance = 48;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const dynamicClearance = Math.min(targetMaxClearance, distance);
                const lowestY =
                  Math.max(startY, mouseCanvasPos.y) + dynamicClearance;

                livePath = [
                  `M ${startX} ${startY}`,
                  `L ${startX} ${lowestY}`,
                  `L ${mouseCanvasPos.x} ${lowestY}`,
                  `L ${mouseCanvasPos.x} ${mouseCanvasPos.y}`,
                ].join(' ');
              } else if (
                hoveredTarget.direction === 'left' ||
                hoveredTarget.direction === 'right'
              ) {
                if (mouseCanvasPos.y > startY) {
                  livePath = [
                    `M ${startX} ${startY}`,
                    `L ${startX} ${mouseCanvasPos.y}`,
                    `L ${mouseCanvasPos.x} ${mouseCanvasPos.y}`,
                  ].join(' ');
                } else {
                  const departureY = startY + RUNWAY_OFFSET;
                  const clearanceX =
                    hoveredTarget.direction === 'left'
                      ? mouseCanvasPos.x - RUNWAY_OFFSET
                      : mouseCanvasPos.x + RUNWAY_OFFSET;
                  livePath = [
                    `M ${startX} ${startY}`,
                    `L ${startX} ${departureY}`,
                    `L ${clearanceX} ${departureY}`,
                    `L ${clearanceX} ${mouseCanvasPos.y}`,
                    `L ${mouseCanvasPos.x} ${mouseCanvasPos.y}`,
                  ].join(' ');
                }
              } else {
                livePath = [
                  `M ${startX} ${startY}`,
                  `L ${startX} ${mouseCanvasPos.y}`,
                  `L ${mouseCanvasPos.x} ${mouseCanvasPos.y}`,
                ].join(' ');
              }
            } else {
              livePath = [
                `M ${startX} ${startY}`,
                `L ${startX} ${mouseCanvasPos.y}`,
                `L ${mouseCanvasPos.x} ${mouseCanvasPos.y}`,
              ].join(' ');
            }
          } else if (
            connectingDirection === 'left' ||
            connectingDirection === 'right'
          ) {
            if (hoveredTarget) {
              if (hoveredTarget.direction === 'top') {
                const isRightAndBelow =
                  connectingDirection === 'right' &&
                  mouseCanvasPos.x > startX &&
                  mouseCanvasPos.y > startY;
                const isLeftAndBelow =
                  connectingDirection === 'left' &&
                  mouseCanvasPos.x < startX &&
                  mouseCanvasPos.y > startY;

                if (isRightAndBelow || isLeftAndBelow) {
                  livePath = [
                    `M ${startX} ${startY}`,
                    `L ${mouseCanvasPos.x} ${startY}`,
                    `L ${mouseCanvasPos.x} ${mouseCanvasPos.y}`,
                  ].join(' ');
                } else {
                  const departureX =
                    connectingDirection === 'left'
                      ? startX - RUNWAY_OFFSET
                      : startX + RUNWAY_OFFSET;
                  const overheadY = mouseCanvasPos.y - RUNWAY_OFFSET;
                  livePath = [
                    `M ${startX} ${startY}`,
                    `L ${departureX} ${startY}`,
                    `L ${departureX} ${overheadY}`,
                    `L ${mouseCanvasPos.x} ${overheadY}`,
                    `L ${mouseCanvasPos.x} ${mouseCanvasPos.y}`,
                  ].join(' ');
                }
              } else if (hoveredTarget.direction === 'bottom') {
                const isRightAndAbove =
                  connectingDirection === 'right' &&
                  mouseCanvasPos.x > startX &&
                  mouseCanvasPos.y < startY;
                const isLeftAndAbove =
                  connectingDirection === 'left' &&
                  mouseCanvasPos.x < startX &&
                  mouseCanvasPos.y < startY;

                if (isRightAndAbove || isLeftAndAbove) {
                  livePath = [
                    `M ${startX} ${startY}`,
                    `L ${mouseCanvasPos.x} ${startY}`,
                    `L ${mouseCanvasPos.x} ${mouseCanvasPos.y}`,
                  ].join(' ');
                } else {
                  const departureX =
                    connectingDirection === 'left'
                      ? startX - RUNWAY_OFFSET
                      : startX + RUNWAY_OFFSET;
                  const underY = mouseCanvasPos.y + RUNWAY_OFFSET;
                  livePath = [
                    `M ${startX} ${startY}`,
                    `L ${departureX} ${startY}`,
                    `L ${departureX} ${underY}`,
                    `L ${mouseCanvasPos.x} ${underY}`,
                    `L ${mouseCanvasPos.x} ${mouseCanvasPos.y}`,
                  ].join(' ');
                }
              } else {
                if (
                  Math.abs(dx) > RUNWAY_OFFSET ||
                  Math.abs(dy) > RUNWAY_OFFSET
                ) {
                  const xOffset =
                    connectingDirection === 'left'
                      ? -RUNWAY_OFFSET
                      : RUNWAY_OFFSET;
                  livePath = `M ${startX} ${startY} L ${startX + xOffset} ${startY} L ${startX + xOffset} ${mouseCanvasPos.y} L ${mouseCanvasPos.x} ${mouseCanvasPos.y}`;
                } else {
                  livePath = `M ${startX} ${startY} L ${mouseCanvasPos.x} ${startY} L ${mouseCanvasPos.x} ${mouseCanvasPos.y}`;
                }
              }
            } else {
              if (
                Math.abs(dx) > RUNWAY_OFFSET ||
                Math.abs(dy) > RUNWAY_OFFSET
              ) {
                const xOffset =
                  connectingDirection === 'left'
                    ? -RUNWAY_OFFSET
                    : RUNWAY_OFFSET;
                livePath = `M ${startX} ${startY} L ${startX + xOffset} ${startY} L ${startX + xOffset} ${mouseCanvasPos.y} L ${mouseCanvasPos.x} ${mouseCanvasPos.y}`;
              } else {
                livePath = `M ${startX} ${startY} L ${mouseCanvasPos.x} ${startY} L ${mouseCanvasPos.x} ${mouseCanvasPos.y}`;
              }
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
