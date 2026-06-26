import React from 'react';
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
  const isConnecting = connectingFromId !== null;

  // 🎯 DYNAMIC ORTHOGONAL ROUTER
  // Calculates clean 90-degree stair-bends from any starting face to any target face
  const calculateOrthogonalPath = (
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    direction: string,
  ) => {
    const offset = 30; // The standard "bend out in space" buffer distance

    if (direction === 'bottom') {
      const exitY = startY + offset;

      // 🎯 FIX: Check if the source and target are row-level neighbors
      // If they are on the same plane, force a deeper, fixed underpass drop (e.g., 40px past the exit)
      const isSameRowUnderpass = Math.abs(endY - startY) < 30;
      const midY = isSameRowUnderpass
        ? exitY + 30
        : endY > exitY
          ? exitY + (endY - exitY) / 2
          : exitY;

      return [
        `M ${startX} ${startY}`,
        `L ${startX} ${midY}`,
        `L ${endX} ${midY}`,
        `L ${endX} ${endY}`,
      ].join(' ');
    }

    if (direction === 'top') {
      const exitY = startY - offset;
      const midY = endY < exitY ? exitY + (endY - exitY) / 2 : exitY;
      return [
        `M ${startX} ${startY}`,
        `L ${startX} ${midY}`,
        `L ${endX} ${midY}`,
        `L ${endX} ${endY}`,
      ].join(' ');
    }

    if (direction === 'right') {
      const exitX = startX + offset;
      const midX = endX > exitX ? exitX + (endX - exitX) / 2 : exitX;
      return [
        `M ${startX} ${startY}`,
        `L ${midX} ${startY}`,
        `L ${midX} ${endY}`,
        `L ${endX} ${endY}`,
      ].join(' ');
    }

    if (direction === 'left') {
      const exitX = startX - offset;
      const midX = endX < exitX ? exitX + (endX - exitX) / 2 : exitX;
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

          // 1️⃣ Determine the exact departure port using our saved sourceDir (Flush to the edge)
          let startX = sX + 128;
          let startY = sY + 72; // Flush to bottom edge

          if (conn.sourceDir === 'top') {
            startX = sX + 128;
            startY = sY - 2;
          } // 🎯 Flush to top
          else if (conn.sourceDir === 'right') {
            startX = sX + 256;
            startY = sY + 40;
          } // 🎯 Flush to right edge
          else if (conn.sourceDir === 'left') {
            startX = sX;
            startY = sY + 40;
          } // 🎯 Flush to left edge

          // 2️⃣ Map out clean target entry points relative to the departure side (Padded for handles)
          let targetX = tX + 128;
          let targetY = tY - 14; // Default entry: slightly above top edge for handle breathing room

          if (conn.sourceDir === 'top') {
            targetX = tX + 128;
            targetY = tY + 94;
          } else if (conn.sourceDir === 'right') {
            // If targeting a block further left than us, enter its right side. Otherwise, enter left.
            targetX = tX < sX ? tX + 268 : tX - 12;
            targetY = tY + 40;
          } else if (conn.sourceDir === 'left') {
            // 🎯 FIX: If targeting a block further left than us (like C to B), enter its RIGHT edge!
            targetX = tX < sX ? tX + 268 : tX - 12;
            targetY = tY + 40;
          } else if (conn.sourceDir === 'bottom' && Math.abs(tY - sY) < 40) {
            targetX = tX + 128;
            targetY = tY + 84;
          }

          // 3️⃣ Fire your standard path calculation string using the concrete direction
          const pathData = calculateOrthogonalPath(
            startX,
            startY,
            targetX,
            targetY,
            conn.sourceDir,
          );

          const connectionKey = `connection__${sourceBlock.id}__${conn.targetId}`;

          return (
            <g
              key={`${sourceBlock.id}-${conn.targetId}-${conn.sourceDir}`}
              className="group/line cursor-pointer pointer-events-auto"
              data-connection-id={connectionKey}
            >
              {/* 1️⃣ LINE HITBOX: Keep it wide (48px) for easy right-clicking, but completely invisible */}
              <path
                d={pathData}
                fill="none"
                stroke="transparent"
                strokeWidth="48"
                className={`cursor-pointer ${isConnecting ? 'pointer-events-none' : 'pointer-events-auto'}`}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openMenu(CommandMenu.ArrowCommand, {
                    top: e.clientY,
                    left: e.clientX,
                    arrowConnectionId: connectionKey,
                  });
                }}
              />

              {/* 2️⃣ VISIBLE CONNECTION LINE */}
              <path
                d={pathData}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
                className="opacity-70 group-hover/line:opacity-100 group-hover/line:stroke-blue-400 transition-colors duration-150"
              />

              {/* 3️⃣ NEW🎯 ARROWHEAD-ONLY HOVER GUIDE */}
              {/* This places a 32px invisible touch target directly over the arrowhead that reveals a clean dashed ring on hover */}
              <circle
                cx={targetX}
                cy={targetY}
                r="16"
                fill="transparent"
                stroke="transparent"
                strokeWidth="1.5"
                style={{ strokeDasharray: '3 3' }}
                className="cursor-pointer transition-colors duration-150 group-hover/line:stroke-blue-500/40 group-hover/line:fill-blue-500/5"
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openMenu(CommandMenu.ArrowCommand, {
                    top: e.clientY,
                    left: e.clientX,
                    arrowConnectionId: connectionKey,
                  });
                }}
              />
            </g>
          );
        });
      })}

      {/* B. Live Drag-to-Connect Adaptive Selection Lasso */}
      {connectingFromId &&
        connectingDirection &&
        (() => {
          const sourceBlock = blocks.find((b) => b.id === connectingFromId);
          if (!sourceBlock) return null;

          const sIndex = blocks.indexOf(sourceBlock);
          const sX = sourceBlock.position?.x ?? 100 + sIndex * 20;
          const sY = sourceBlock.position?.y ?? 100 + sIndex * 20;

          let startX = sX + 128;
          let startY = sY + 82;

          if (connectingDirection === 'top') {
            startX = sX + 128;
            startY = sY - 2;
          } else if (connectingDirection === 'right') {
            startX = sX + 256;
            startY = sY + 40;
          } else if (connectingDirection === 'left') {
            startX = sX;
            startY = sY + 40;
          }

          const livePath = calculateOrthogonalPath(
            startX,
            startY,
            mouseCanvasPos.x,
            mouseCanvasPos.y,
            connectingDirection,
          );

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
