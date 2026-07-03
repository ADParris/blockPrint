import React, { useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useSpatialMouse } from '../../../hooks/useSpacialMouse';
import { WorkspaceViewMode } from '../../../state/types';
import { useProjectStore } from '../../../state/useProjectStore';
import Card from '../../Card';
import ConnectionLayer from './ConnectionLayer';

const SpatialCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);

  const { projectId, pageId } = useParams<{
    projectId: string;
    pageId: string;
  }>();

  const pages = useProjectStore((state) => state.pages);

  const activePage =
    projectId && pageId && pages[projectId]
      ? pages[projectId].find((p) => p.id === pageId)
      : null;

  const { isDragActive, cameraOffset, zoomScale, mouseState, mouseHandlers } =
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
      {/* 🚀 THE TRANSFORMING STAGE (World Space) */}
      <div
        className="absolute inset-0 origin-top-left w-full h-full"
        style={{
          transform: `translate(${cameraOffset.x}px, ${cameraOffset.y}px) scale(${zoomScale})`,
        }}
      >
        {/* 🗺️ Native Grid Layer: Stays 100% of the viewport but zooms automatically with the stage */}
        <svg
          id="grid-bg"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          <defs>
            {/* Hardcoded 40x40 grid. Let the browser handle scaling it natively! */}
            <pattern
              id="dot-grid"
              width={40}
              height={40}
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx={2}
                cy={2}
                r={1}
                fill="#334155"
                className="opacity-40"
              />
            </pattern>
          </defs>
          {/* Fill the infinite viewport area */}
          <rect width="100%" height="100%" fill="url(#dot-grid)" />
        </svg>

        {/* Dynamic Vector Lines Layer */}
        <ConnectionLayer
          blocks={activePage.blocks}
          connectingFromId={mouseState.connectingFromId}
          connectingDirection={mouseState.connectingDirection}
          mouseCanvasPos={mouseState.mouseCanvasPos}
        />

        {/* 🚀 Selection Lasso Layer (Now safely inside world-space!) */}
        {mouseState.isLassoActive && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
            <rect
              x={Math.min(mouseState.lassoStart.x, mouseState.lassoEnd.x)}
              y={Math.min(mouseState.lassoStart.y, mouseState.lassoEnd.y)}
              width={Math.abs(mouseState.lassoEnd.x - mouseState.lassoStart.x)}
              height={Math.abs(mouseState.lassoEnd.y - mouseState.lassoStart.y)}
              fill="rgba(56, 189, 248, 0.08)"
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeDasharray="4"
            />
          </svg>
        )}

        {/* Card Component Wrapper Layer */}
        <div className="absolute inset-0 pointer-events-none z-10">
          {activePage.blocks.map((block, index) => (
            <Card
              key={block.id}
              viewContext={WorkspaceViewMode.PageCanvas}
              block={block}
              index={index}
              isPanning={mouseState.isPanning}
              isActiveDrag={mouseState.activeDragId === block.id}
              isDraggingCanvas={isDragActive()}
            />
          ))}
        </div>
      </div>

      {/* HUD Info (Stays fixed relative to browser screen) */}
      <div className="absolute bottom-4 right-4 bg-slate-950/80 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-md text-xs text-slate-400 pointer-events-none z-30">
        Zoom: {Math.round(zoomScale * 100)}% | Pan: {Math.round(cameraOffset.x)}
        x, {Math.round(cameraOffset.y)}y
      </div>
    </div>
  );
};

export default SpatialCanvas;
