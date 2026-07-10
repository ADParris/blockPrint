// src/components/Views/SpatialCanvas.tsx
import React, { useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useSpatialMouse } from '../../../hooks/useSpacialMouse';
import { ActivityFeedItems, WorkspaceViewMode } from '../../../state/types'; // 🎯 Added ActivityFeedItems imports
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
  // 🎯 Pull your independent activity feed dictionary to cross-reference
  const activityFeedItems = useProjectStore((state) => state.activityFeedItems);

  const activePage =
    projectId && pageId && pages[projectId]
      ? pages[projectId].find((p) => p.id === pageId)
      : null;

  // 🎯 FILTER LAYER: Filter notes and stubs completely out of spatial calculations & layout arrays
  const targetProjectId = projectId || 'default-project';
  const projectFeed = activityFeedItems[targetProjectId] || [];

  const canvasBlocks = (activePage?.blocks ?? []).filter((block) => {
    const isFeedItem = projectFeed.some(
      (item) =>
        item.targetBlockId === block.id &&
        (item.type === ActivityFeedItems.Note ||
          item.type === ActivityFeedItems.Stub),
    );
    return !isFeedItem; // Hide if it matches a timeline note or stub
  });

  const { isDragActive, cameraOffset, zoomScale, mouseState, mouseHandlers } =
    useSpatialMouse({
      projectId,
      pageId,
      canvasRef,
      blocks: canvasBlocks, // 🎯 Feed the filtered blocks to the hook
    });

  if (!activePage) return null;

  return (
    <div
      ref={canvasRef}
      {...mouseHandlers}
      className={`relative w-full h-full overflow-hidden select-none bg-surface ${
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
        {/* Grid Background */}
        <svg
          id="grid-bg"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          <defs>
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
          <rect width="100%" height="100%" fill="url(#dot-grid)" />
        </svg>

        {/* Dynamic Vector Lines Layer */}
        <ConnectionLayer
          blocks={canvasBlocks} // 🎯 Filtered
          connectingFromId={mouseState.connectingFromId}
          connectingDirection={mouseState.connectingDirection}
          mouseCanvasPos={mouseState.mouseCanvasPos}
        />

        {/* Lasso Layer */}
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
          {canvasBlocks.map(
            (
              block,
              index, // 🎯 Filtered
            ) => (
              <Card
                key={block.id}
                viewContext={WorkspaceViewMode.PageCanvas}
                block={block}
                index={index}
                isPanning={mouseState.isPanning}
                isActiveDrag={mouseState.activeDragId === block.id}
                isDraggingCanvas={isDragActive()}
              />
            ),
          )}
        </div>
      </div>

      {/* HUD Info */}
      <div className="absolute bottom-4 right-4 bg-slate-950/80 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-md text-xs text-slate-400 pointer-events-none z-30">
        Zoom: {Math.round(zoomScale * 100)}% | Pan: {Math.round(cameraOffset.x)}
        x, {Math.round(cameraOffset.y)}y
      </div>
    </div>
  );
};

export default SpatialCanvas;
