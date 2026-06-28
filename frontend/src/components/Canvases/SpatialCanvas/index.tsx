// src/components/Canvases/SpatialCanvas.tsx
import React, { useRef } from 'react';
import { useSpatialMouse } from '../../../hooks/useSpacialMouse';
import { useProjectStore } from '../../../state/useProjectStore';
import Card from './Card';
import ConnectionLayer from './ConnectionLayer';

const SpatialCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);

  // 🎯 Resolve the current active page context from our store slices
  const { activeProjectId, activePageId, pages } = useProjectStore(
    (state) => state,
  );

  const activePage =
    activeProjectId && activePageId && pages[activeProjectId]
      ? pages[activeProjectId].find((p) => p.id === activePageId)
      : null;

  // 🔌 Attach our decoupled state machine hook safely!
  const { cameraOffset, zoomScale, bgFill, mouseState, mouseHandlers } =
    useSpatialMouse({
      canvasRef,
      blocks: activePage?.blocks ?? [],
    });

  if (!activePage) return null;

  return (
    <div
      ref={canvasRef}
      {...mouseHandlers}
      className={`relative w-full h-full overflow-hidden select-none bg-[#070a13] ${
        mouseState.activeDragId || mouseState.isPanning
          ? 'cursor-grabbing'
          : 'cursor-grab'
      }`}
    >
      {/* 🗺️ Infinite Grid Pattern */}
      <svg
        id="grid-bg"
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        <defs>
          <pattern
            id={`dot-grid-${Math.round(zoomScale * 100)}`}
            width={40 * zoomScale}
            height={40 * zoomScale}
            patternUnits="userSpaceOnUse"
            x={cameraOffset.x}
            y={cameraOffset.y}
          >
            <circle cx={2} cy={2} r={1} fill="#334155" className="opacity-40" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={bgFill} />
      </svg>

      {/* 🚀 The Transforming Stage */}
      <div
        className="relative w-full h-full min-h-screen"
        style={{
          transform: `translate(${cameraOffset.x}px, ${cameraOffset.y}px) scale(${zoomScale})`,
        }}
      >
        {/* Dynamic Vector Lines Layer */}
        <ConnectionLayer
          blocks={activePage.blocks}
          connectingFromId={mouseState.connectingFromId}
          connectingDirection={mouseState.connectingDirection}
          mouseCanvasPos={mouseState.mouseCanvasPos}
        />

        {/* Card Component Wrapper Layer */}
        <div className="absolute inset-0 pointer-events-none z-10">
          {activePage.blocks.map((block, index) => (
            <Card
              key={block.id}
              block={block}
              index={index}
              isPanning={mouseState.isPanning}
              isActiveDrag={mouseState.activeDragId === block.id}
            />
          ))}
        </div>
      </div>

      {/* HUD Info */}
      <div className="absolute bottom-4 right-4 bg-slate-950/80 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-md text-xs text-slate-400 pointer-events-none">
        Zoom: {Math.round(zoomScale * 100)}% | Pan: {Math.round(cameraOffset.x)}
        x, {Math.round(cameraOffset.y)}y
      </div>
    </div>
  );
};

export default SpatialCanvas;
