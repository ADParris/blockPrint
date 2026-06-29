// src/components/Canvases/GlobalCanvas.tsx
import React, { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCanvasKeyboard } from '../../hooks/useCanvasKeyboard';
import {
  CommandMenus,
  WorkspaceViewMode,
  type CommandMenusType,
} from '../../state/types';
import { useModalStore } from '../../state/useModalStore';
import { useProjectStore } from '../../state/useProjectStore';
import DocumentCanvas from '../Canvases/DocumentCanvas';
import SpatialCanvas from '../Canvases/SpatialCanvas';
import ArrowCommandMenu from '../Menus/ArrowCommandMenu';
import BlockCommandMenu from '../Menus/BlockCommandMenu';
import Modal from '../Modal';
import { PageKanbanView } from './PageKanbanView'; // 🎯 Import our new view panel
import { ProjectDashboardView } from './ProjectDashboardView';

const GlobalView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // 🎯 1. Extract parameters straight from the browser URL address bar
  const { namespace, projectId, pageId } = useParams<{
    namespace: string;
    projectId?: string;
    pageId?: string;
  }>();

  // Fetch store methods and operational states individually to ensure stable selector subscriptions
  const projects = useProjectStore((state) => state.projects);
  const pages = useProjectStore((state) => state.pages);
  const activeBlockId = useProjectStore((state) => state.activeBlockId);
  const activeViewMode = useProjectStore((state) => state.activeViewMode);
  const isLoading = useProjectStore((state) => state.isLoading);
  const setActiveBlockId = useProjectStore((state) => state.setActiveBlockId);
  const insertBlockAtIndex = useProjectStore(
    (state) => state.insertBlockAtIndex,
  );
  const setActiveProjectId = useProjectStore(
    (state) => state.setActiveProjectId,
  );
  const setActivePageId = useProjectStore((state) => state.setActivePageId);

  const { activeMenuId, position, openMenu, closeMenu } = useModalStore();

  // 🎯 2. Keep Zustand synchronized AND intercept dead/deleted paths
  useEffect(() => {
    if (isLoading) return;

    setActiveProjectId(projectId || null);
    setActivePageId(pageId || null);

    // 🛡️ ROUTER GUARD: If the URL has a projectId, verify that it actually exists in our store
    if (projectId) {
      const projectExists = projects.some((p) => p.id === projectId);

      if (!projectExists) {
        console.warn(
          'Viewing a deleted or invalid project. Redirecting to home...',
        );
        navigate(`/${namespace || 'ADParris'}`);
      }
    }
  }, [
    projectId,
    pageId,
    projects,
    isLoading,
    namespace,
    navigate,
    setActiveProjectId,
    setActivePageId,
  ]);

  // 🎯 3. Safely resolve active page using the parameters read from the URL
  const activePage =
    projectId && pageId && pages[projectId]
      ? pages[projectId].find((p) => p.id === pageId)
      : null;

  const handleCanvasClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    if (target.closest('[data-drag-handle-for]')) {
      const dragHandle = target.closest('[data-drag-handle-for]');
      if (dragHandle) {
        const targetBlockId = dragHandle.getAttribute('data-drag-handle-for');
        if (targetBlockId) {
          e.stopPropagation();
          setActiveBlockId(targetBlockId);

          // dragHandle is guaranteed non-null here by the outer condition
          const rect = dragHandle.getBoundingClientRect();
          const top = rect.bottom + 4;
          const left = rect.left;

          openMenu(CommandMenus.BlockCommand, { top, left });
          return;
        }
      }
    }

    if (
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

    // Only auto-insert text blocks clicking the canvas empty-space if we are explicitly on the Document view mode
    if (activeViewMode === WorkspaceViewMode.PageDocument && activePage) {
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
        const newBlockId = insertBlockAtIndex(activePage.blocks.length);
        setActiveBlockId(newBlockId);

        setTimeout(() => {
          const nextTextarea = containerRef.current?.querySelector(
            `textarea[data-block-id="${newBlockId}"]`,
          ) as HTMLTextAreaElement;
          if (nextTextarea) {
            nextTextarea.focus();
            nextTextarea.setSelectionRange(0, 0);
          }
        }, 50);
      }
    }
  };

  const { handleKeyDown } = useCanvasKeyboard();
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
            connectionId={position?.arrowConnectionId ?? ''}
            onClose={closeMenu}
          />
        );
      case CommandMenus.BlockCommand:
        return <BlockCommandMenu />;
      default:
        return null;
    }
  };

  // 🎯 4. The Router-Driven View Switch Engine
  const currentLayout = () => {
    // 🎯 1. Highest Priority: If there's a pageId in the URL, immediately look at activeViewMode state
    if (pageId) {
      if (!activePage) {
        return (
          <div className="flex h-full w-full items-center justify-center bg-zinc-950 text-zinc-600 text-xs italic">
            Loading page workspace...
          </div>
        );
      }

      // Route layout layers dynamically using our explicit panel views
      switch (activeViewMode) {
        case WorkspaceViewMode.PageCanvas:
          return <SpatialCanvas />;
        case WorkspaceViewMode.PageKanban:
          return <PageKanbanView />; // 🎯 Render our beautiful Kanban block list
        case WorkspaceViewMode.PageDocument:
        default:
          return <DocumentCanvas />;
      }
    }

    // 🎯 2. Secondary Priority: If there's a projectId in the URL but no pageId, show the Dashboard
    if (projectId) {
      return <ProjectDashboardView />;
    }

    // 🎯 3. Baseline Fallback: Root namespace handle baseline overview
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

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="text-lg font-medium animate-pulse">
          Loading workspace...
        </div>
      </div>
    );
  }

  return (
    <main
      ref={containerRef}
      className="w-full h-full min-h-full outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={handleCanvasClick}
    >
      {currentLayout()}

      {isValidMenu && activeMenuId && (
        <Modal menuPosition={position} onClose={closeMenu}>
          {currentMenu(activeMenuId)}
        </Modal>
      )}
    </main>
  );
};

export default GlobalView;
