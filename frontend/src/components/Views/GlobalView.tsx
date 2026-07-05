// src/components/Canvases/GlobalCanvas.tsx
import React, { useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useCanvasKeyboard } from '../../hooks/useCanvasKeyboard';
import {
  CommandMenus,
  WorkspaceViewMode,
  type CommandMenusType,
  type WorkspaceViewModeType,
} from '../../state/types';
import { useModalStore } from '../../state/useModalStore';
import { useProjectStore } from '../../state/useProjectStore';
import DocumentCanvas from '../Canvases/DocumentCanvas';
import SpatialCanvas from '../Canvases/SpatialCanvas';
import ArrowCommandMenu from '../Menus/ArrowCommandMenu';
import BlockCommandMenu from '../Menus/BlockCommandMenu';
import Modal from '../Modal';
import Sidebar from '../Sidebar';
import { PageBlockKanbanView } from './PageBlockKanbanView';
import { PageKanbanView } from './PageKanbanView';
import { ProjectDashboardView } from './ProjectDashboardView';

const GlobalView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // 1. Extract router configurations
  const { namespace, projectId, pageId } = useParams<{
    namespace: string;
    projectId?: string;
    pageId?: string;
  }>();

  // 2. Fetch Store subscriptions
  const pages = useProjectStore((state) => state.pages);
  const activeBlockId = useProjectStore((state) => state.activeBlockId);
  const isLoading = useProjectStore((state) => state.isLoading);
  const setActiveBlockId = useProjectStore((state) => state.setActiveBlockId);
  const insertBlockAtIndex = useProjectStore(
    (state) => state.insertBlockAtIndex,
  );

  const { activeMenuId, position, openMenu, closeMenu } = useModalStore();

  // 🎯 3. Derive view layouts deterministically from uniform trailing route targets
  const isRoadmap = location.pathname.endsWith('/roadmap');
  const isCanvas = location.pathname.endsWith('/canvas');
  const isBlockKanban = location.pathname.endsWith('/kanban');

  let resolvedViewMode: WorkspaceViewModeType =
    WorkspaceViewMode.ProjectDashboard;

  if (pageId) {
    if (isCanvas) {
      resolvedViewMode = WorkspaceViewMode.PageCanvas;
    } else if (isBlockKanban) {
      resolvedViewMode = WorkspaceViewMode.PageKanban; // Utilizing existing Kanban types for blocks
    } else {
      resolvedViewMode = WorkspaceViewMode.PageDocument;
    }
  } else if (projectId && isRoadmap) {
    resolvedViewMode = WorkspaceViewMode.PageKanban;
  }

  // 4. Invoke keyboard listener
  const { handleKeyDown } = useCanvasKeyboard({
    projectId,
    pageId,
    isDocumentView: resolvedViewMode === WorkspaceViewMode.PageDocument,
    isCanvasView: resolvedViewMode === WorkspaceViewMode.PageCanvas,
  });

  // 5. Derived active page entity
  const activePage =
    projectId && pageId && pages[projectId]
      ? pages[projectId].find((p) => p.id === pageId)
      : null;

  // 🎯 1. Handle normal Left Clicks (Unselecting and clicking empty space)
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (resolvedViewMode !== WorkspaceViewMode.PageDocument) return;

    const target = e.target as HTMLElement;

    // Skip handles, blocks, and formatting containers completely on standard clicks
    if (
      target.closest('[data-drag-handle-for]') ||
      target.closest('[data-block-id]') ||
      target.closest('.group\\/code') ||
      target.closest('.header-group')
    ) {
      return;
    }

    if (activeBlockId !== '') {
      setActiveBlockId('');
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      return;
    }

    // (Keep your existing click-below-last-block logic untouched right here...)
    if (projectId && pageId && activePage) {
      const pElements =
        containerRef.current?.querySelectorAll('[data-block-id]');
      const lastBlock = pElements?.[pElements.length - 1];
      let isClickingBelowLastBlock = false;
      if (lastBlock) {
        const lastBlockRect = lastBlock.getBoundingClientRect();
        if (e.clientY > lastBlockRect.bottom) isClickingBelowLastBlock = true;
      } else {
        isClickingBelowLastBlock = true;
      }

      if (isClickingBelowLastBlock) {
        const newBlockId = insertBlockAtIndex(
          projectId,
          pageId,
          activePage.blocks.length,
        );
        setActiveBlockId(newBlockId);
        setTimeout(() => {
          const nextTextarea = containerRef.current?.querySelector(
            `textarea[data-block-id="${newBlockId}"]`,
          ) as HTMLTextAreaElement;
          if (nextTextarea) nextTextarea.focus();
        }, 50);
      }
    }
  };

  // 🎯 2. Handle Right-Clicks on Drag Handles to open your Context Menu
  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    if (resolvedViewMode !== WorkspaceViewMode.PageDocument) return;

    const target = e.target as HTMLElement;

    // 1. Try to find an explicit drag handle first
    let dragHandle = target.closest('[data-drag-handle-for]');

    // 🎯 HITBOX EXPANSION: If they missed the handle but right-clicked the block line wrapper itself
    if (!dragHandle) {
      const blockContainer = target.closest('[data-block-id]');
      if (blockContainer) {
        const blockId = blockContainer.getAttribute('data-block-id');
        dragHandle = containerRef.current?.querySelector(
          `[data-drag-handle-for="${blockId}"]`,
        ) as HTMLElement | null;
      }
    }

    if (dragHandle) {
      e.preventDefault(); // 🛑 Bye-bye browser default menu!
      e.stopPropagation();

      const targetBlockId = dragHandle.getAttribute('data-drag-handle-for');
      if (targetBlockId) {
        setActiveBlockId(targetBlockId);

        const rect = dragHandle.getBoundingClientRect();
        const top = rect.bottom + 4;
        const left = rect.left;

        openMenu(CommandMenus.BlockCommand, { top, left });
        return;
      }
    }

    // 🎯 CATCH-ALL PROTECTION: Disable standard browser right-click anywhere on the document editor
    // to avoid distracting the user with accidental native popups.
    e.preventDefault();
  };

  // 🎯 3. Handle Left-Click Mouse Down on Handles to allow Drag-And-Drop setups to wake up
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (resolvedViewMode !== WorkspaceViewMode.PageDocument) return;

    const target = e.target as HTMLElement;
    const dragHandle = target.closest('[data-drag-handle-for]');

    // Only intercept if it's a left click on a drag handle
    if (dragHandle && e.button === 0) {
      const targetBlockId = dragHandle.getAttribute('data-drag-handle-for');
      if (targetBlockId) {
        setActiveBlockId(targetBlockId);
        // 💡 Notice we do NOT call e.stopPropagation() here!
        // This lets your HTML5 draggable/reorder engine deeper inside DocumentCanvas see the event!
      }
    }
  };

  const isArrowMenu = activeMenuId?.startsWith('connection-');
  const isValidMenu = activeMenuId
    ? Object.values(CommandMenus).includes(activeMenuId as CommandMenusType) ||
      isArrowMenu
    : false;

  const currentMenu = (menuId: string) => {
    switch (menuId) {
      case CommandMenus.ArrowCommand:
        return (
          <ArrowCommandMenu
            projectId={projectId}
            pageId={pageId}
            connectionId={position?.arrowConnectionId ?? ''}
            onClose={closeMenu}
          />
        );
      case CommandMenus.BlockCommand:
        return <BlockCommandMenu projectId={projectId} pageId={pageId} />;
      default:
        return null;
    }
  };

  // 🎯 6. Render View Components matching clean router contexts
  const renderMainContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-zinc-400">
          <div className="text-lg font-medium animate-pulse">
            Loading workspace...
          </div>
        </div>
      );
    }

    if (pageId) {
      if (!activePage) {
        return (
          <div className="flex h-full w-full items-center justify-center bg-zinc-950 text-zinc-600 text-xs italic">
            Loading page workspace...
          </div>
        );
      }

      // 🎯 Match trailing router endpoints directly
      if (isBlockKanban) return <PageBlockKanbanView />;
      if (isCanvas) return <SpatialCanvas />;

      // Default / fallback component view
      return <DocumentCanvas />;
    }

    if (projectId) {
      if (isRoadmap) return <PageKanbanView />;
      return <ProjectDashboardView />;
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs gap-1">
        <p className="font-semibold text-slate-400">
          Welcome to {namespace || 'ADParris'}'s Workspace
        </p>
        <p className="text-slate-600">
          Select a project folder from the sidebar to get rolling.
        </p>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-slate-100">
      <aside className="w-64 h-full border-r border-slate-800/60 bg-zinc-900 shrink-0">
        <Sidebar />
      </aside>

      <div
        className={`flex-1 h-full custom-scrollbar ${
          resolvedViewMode === WorkspaceViewMode.PageDocument
            ? 'overflow-y-auto'
            : 'overflow-hidden'
        }`}
      >
        <main
          ref={containerRef}
          className="w-full h-full min-h-full outline-none"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onClick={handleCanvasClick}
          onMouseDown={handleCanvasMouseDown} // 👈 Wakes up block selection without breaking drags
          onContextMenu={handleCanvasContextMenu} // 👈 Overrides right-click on handles perfectly
        >
          {renderMainContent()}

          {isValidMenu && activeMenuId && (
            <Modal menuPosition={position} onClose={closeMenu}>
              {currentMenu(activeMenuId)}
            </Modal>
          )}
        </main>
      </div>
    </div>
  );
};

export default GlobalView;
