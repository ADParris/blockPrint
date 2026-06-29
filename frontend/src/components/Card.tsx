import React from 'react';
import {
  type CanvasBlock,
  type WorkspaceViewModeType,
  WorkspaceViewMode,
} from '../state/types';

interface CardProps {
  children: React.ReactNode;
  viewContext?: WorkspaceViewModeType; // Contextual rendering for parent layouts
  onClick?: () => void;

  // 🗺️ Optional Spatial Canvas specific properties
  block?: CanvasBlock;
  index?: number;
  isPanning?: boolean;
  isActiveDrag?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  viewContext = WorkspaceViewMode.PageDocument, // Default context
  onClick,
  block,
  index = 0,
  isPanning = false,
  isActiveDrag = false,
}) => {
  const isCanvas = viewContext === WorkspaceViewMode.PageCanvas;

  // 1. Resolve dynamic canvas dimensions safely if mounted inside Spatial Canvas
  const posX = block?.position?.x ?? 100 + index * 20;
  const posY = block?.position?.y ?? 100 + index * 20;

  // 2. Build the unified layout inline style dictionary
  const dynamicStyle: React.CSSProperties = isCanvas
    ? {
        position: 'absolute',
        left: `${posX}px`,
        top: `${posY}px`,
        cursor: isPanning ? 'grabbing' : 'grab',
      }
    : {};

  // 3. Centralized style token tracks
  const baseClasses =
    'bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-xl transition-all select-none text-slate-200 text-sm';

  const contextClasses = {
    [WorkspaceViewMode.PageCanvas]: `group w-64 p-4 pointer-events-auto transition-shadow duration-100 ${
      isActiveDrag
        ? 'shadow-2xl ring-2 ring-blue-500/50 z-30'
        : 'shadow-xl z-20'
    }`,
    [WorkspaceViewMode.PageKanban]:
      'relative p-3.5 active:cursor-grabbing shadow-sm cursor-pointer z-20',
    [WorkspaceViewMode.PageDocument]:
      'relative p-3 w-full shadow-sm cursor-pointer',
    [WorkspaceViewMode.ProjectDashboard]:
      'relative p-3 w-full shadow-sm cursor-pointer',
  };

  return (
    <div
      onClick={onClick}
      style={dynamicStyle}
      data-canvas-block-id={isCanvas ? block?.id : undefined}
      className={`${baseClasses} ${contextClasses[viewContext]}`}
    >
      {/* ⚪ Interactive Anchor Pins — Only mounted if active inside Spatial view context */}
      {isCanvas && (
        <>
          <div
            data-anchor-dir="top"
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10 hover:scale-125 cursor-n-resize"
          />
          <div
            data-anchor-dir="right"
            className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10 hover:scale-125 cursor-e-resize"
          />
          <div
            data-anchor-dir="bottom"
            className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10 hover:scale-125 cursor-s-resize"
          />
          <div
            data-anchor-dir="left"
            className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10 hover:scale-125 cursor-w-resize"
          />
        </>
      )}

      {/* Children elements populate standard inner layouts cleanly */}
      <div className={isCanvas ? 'pointer-events-none' : undefined}>
        {children}
      </div>
    </div>
  );
};

export default Card;
