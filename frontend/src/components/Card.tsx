// src/components/Card.tsx
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  type CanvasBlock,
  type WorkspaceViewModeType,
  WorkspaceViewMode,
} from '../state/types';
import { paths } from '../utils/routes';
import BlockPreviewRenderer from './Previews/BlockPreviewRenderer';

interface CardProps {
  children?: React.ReactNode;
  viewContext?: WorkspaceViewModeType;
  onClick?: () => void;
  block?: CanvasBlock;
  index?: number;
  isPanning?: boolean;
  isActiveDrag?: boolean;
  isDraggingCanvas?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  viewContext = WorkspaceViewMode.PageDocument,
  onClick,
  block,
  index = 0,
  isPanning = false,
  isActiveDrag = false,
  isDraggingCanvas = false,
}) => {
  const navigate = useNavigate();
  const { namespace, projectId, pageId } = useParams();
  const resolvedNamespace = namespace || 'ADParris';
  const resolvedProjectId = projectId || '';
  const resolvedPageId = pageId || '';

  const isPreviewLayout = viewContext !== WorkspaceViewMode.PageDocument;
  const isCanvas = viewContext === WorkspaceViewMode.PageCanvas;
  const isEdgeToEdge = isCanvas && !!block;

  const posX = block?.position?.x ?? 100 + index * 20;
  const posY = block?.position?.y ?? 100 + index * 20;

  const dynamicStyle: React.CSSProperties = isCanvas
    ? {
        position: 'absolute',
        left: `${posX}px`,
        top: `${posY}px`,
        cursor: isPanning ? 'grabbing' : 'grab',
      }
    : {};

  const baseClasses =
    'bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-xl transition-all select-none text-slate-200 text-sm relative';

  const contextClasses = {
    [WorkspaceViewMode.PageCanvas]: `group w-64 h-32 pointer-events-auto transition-shadow duration-100 ${
      isActiveDrag
        ? 'shadow-2xl ring-2 ring-blue-500/50 z-30'
        : 'shadow-xl z-20'
    }`,
    [WorkspaceViewMode.PageKanban]: `group w-64 h-32 pointer-events-auto active:cursor-grabbing transition-shadow duration-100 cursor-pointer ${
      isActiveDrag
        ? 'shadow-2xl ring-2 ring-blue-500/50 z-30'
        : 'shadow-xl z-20'
    }`,
    [WorkspaceViewMode.PageDocument]:
      'relative p-3 w-full shadow-sm cursor-pointer',
    [WorkspaceViewMode.ProjectDashboard]:
      'relative p-3 w-full shadow-sm cursor-pointer',
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-anchor-dir]')) return;
    if (isDraggingCanvas) return;

    // 🎯 If it's any preview mode and has block data, automatically snap back to the document anchor
    if (isPreviewLayout && block) {
      navigate(
        `${paths.pageDocument(resolvedNamespace, resolvedProjectId, resolvedPageId)}#block-${block.id}`,
      );
    } else if (onClick) {
      onClick();
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (viewContext === WorkspaceViewMode.PageKanban && block) {
      e.dataTransfer.setData('text/plain', block.id);
      // 🎯 Set custom mime-type token
      e.dataTransfer.setData('application/x-drag-block', 'true');
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  return (
    <div
      onClick={handleCardClick}
      style={dynamicStyle}
      data-canvas-block-id={isCanvas ? block?.id : undefined}
      data-kanban-block-id={
        viewContext === WorkspaceViewMode.PageKanban ? block?.id : undefined
      }
      draggable={
        viewContext === WorkspaceViewMode.PageKanban && !isDraggingCanvas
      }
      onDragStart={handleDragStart}
      className={`${baseClasses} ${contextClasses[viewContext]}`}
    >
      {isCanvas && (
        <>
          <div
            data-anchor-dir="top"
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 hover:scale-125 cursor-n-resize"
          />
          <div
            data-anchor-dir="right"
            className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 hover:scale-125 cursor-e-resize"
          />
          <div
            data-anchor-dir="bottom"
            className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 hover:scale-125 cursor-s-resize"
          />
          <div
            data-anchor-dir="left"
            className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 hover:scale-125 cursor-w-resize"
          />
        </>
      )}

      <div
        className={
          isPreviewLayout
            ? 'pointer-events-none h-full w-full relative'
            : undefined
        }
      >
        {/* 🎯 Clean routing fallback match */}
        {isPreviewLayout ? (
          <BlockPreviewRenderer block={block} fallbackChildren={children} />
        ) : (
          children
        )}

        {isPreviewLayout && !isEdgeToEdge && (
          <div className="absolute inset-x-0 bottom-0 h-6 bg-linear-to-t from-slate-900 to-transparent pointer-events-none" />
        )}
      </div>
    </div>
  );
};

export default Card;
