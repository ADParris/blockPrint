// src/components/Canvases/SpatialCanvas.tsx
import React, { useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useSpatialMouse } from '../../../hooks/useSpacialMouse';
import { WorkspaceViewMode } from '../../../state/types';
import { useProjectStore } from '../../../state/useProjectStore';
import Card from '../../Card';
import ConnectionLayer from './ConnectionLayer';

const SpatialCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);

  // 🎯 1. Read layout targets straight from the active browser address bar parameters
  const { projectId, pageId } = useParams<{
    projectId: string;
    pageId: string;
  }>();

  // 🎯 2. Atomic Selector Subscriptions to enforce stable render performance
  const pages = useProjectStore((state) => state.pages);

  // 3. Resolve the matching active page context out of state memory
  const activePage =
    projectId && pageId && pages[projectId]
      ? pages[projectId].find((p) => p.id === pageId)
      : null;

  // 🔌 Attach our decoupled state machine hook safely!
  const { cameraOffset, zoomScale, bgFill, mouseState, mouseHandlers } =
    useSpatialMouse({
      projectId,
      pageId,
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
              viewContext={WorkspaceViewMode.PageCanvas}
              key={block.id}
              block={block}
              index={index}
              isPanning={mouseState.isPanning}
              isActiveDrag={mouseState.activeDragId === block.id}
            >
              <div className="text-[10px] uppercase font-bold tracking-wider text-blue-400 mb-1 pointer-events-none">
                {block.type || 'p'} Element
              </div>
              <div className="pointer-events-none">
                {block.content || (
                  <span className="text-slate-600 italic">Empty block</span>
                )}
              </div>
            </Card>
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
