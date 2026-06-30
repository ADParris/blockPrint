// src/components/Canvases/GlobalCanvas.tsx
import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
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
import { BlockKanbanView } from './BlockKanbanView';
import { PageKanbanView } from './PageKanbanView';
import { ProjectDashboardView } from './ProjectDashboardView';

const GlobalView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

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

  // 🎯 Keep Zustand synchronized AND intercept dead/deleted paths
  useEffect(() => {
    if (isLoading) return;

    setActiveProjectId(projectId || null);
    setActivePageId(pageId || null);

    const currentViewMode = useProjectStore.getState().activeViewMode;
    const isRoadmap = location.pathname.endsWith('/roadmap');
    const isCanvas = location.pathname.endsWith('/canvas');

    // 🎯 1. Handle Page-Level Context View Modes
    if (pageId) {
      if (isRoadmap) {
        if (currentViewMode !== WorkspaceViewMode.PageKanban) {
          useProjectStore.setState({
            activeViewMode: WorkspaceViewMode.PageKanban,
          });
        }
      } else if (isCanvas) {
        if (currentViewMode !== WorkspaceViewMode.PageCanvas) {
          useProjectStore.setState({
            activeViewMode: WorkspaceViewMode.PageCanvas,
          });
        }
      } else {
        // 🎯 Cast the array as the broader WorkspaceViewModeType[] to satisfy .includes()
        const validPageModes: WorkspaceViewModeType[] = [
          WorkspaceViewMode.PageDocument,
          WorkspaceViewMode.PageCanvas,
        ];

        if (!validPageModes.includes(currentViewMode)) {
          useProjectStore.setState({
            activeViewMode: WorkspaceViewMode.PageDocument,
          });
        }
      }
    }
    // 🎯 2. Handle Project-Level Context View Modes (Runs ONLY if pageId is missing)
    else if (projectId) {
      if (isRoadmap) {
        if (currentViewMode !== WorkspaceViewMode.PageKanban) {
          useProjectStore.setState({
            activeViewMode: WorkspaceViewMode.PageKanban,
          });
        }
      } else {
        if (currentViewMode !== WorkspaceViewMode.ProjectDashboard) {
          useProjectStore.setState({
            activeViewMode: WorkspaceViewMode.ProjectDashboard,
          });
        }
      }
    }

    // 🛡️ ROUTER GUARD: Verify project exists
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
    location.pathname,
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
    if (activeViewMode !== WorkspaceViewMode.PageDocument) {
      return;
    }

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

    // 🎯 1. Highest Priority: If there's a pageId in the URL, handle page-level routing
    if (pageId) {
      if (!activePage) {
        return (
          <div className="flex h-full w-full items-center justify-center bg-zinc-950 text-zinc-600 text-xs italic">
            Loading page workspace...
          </div>
        );
      }

      // 🎯 Micro check: If we are looking at a page, and it explicitly ends with roadmap
      if (location.pathname.endsWith('/roadmap')) {
        return <BlockKanbanView />;
      }

      // Standard page canvas views fallback
      switch (activeViewMode) {
        case WorkspaceViewMode.PageCanvas:
          return <SpatialCanvas />;
        case WorkspaceViewMode.PageDocument:
        default:
          return <DocumentCanvas />;
      }
    }

    // 🎯 2. Secondary Priority: Project-level views (Runs ONLY if pageId is missing)
    if (projectId) {
      // Macro check: It ends with /roadmap and we already know pageId doesn't exist
      if (location.pathname.endsWith('/roadmap')) {
        return <PageKanbanView />;
      }

      // Default fallback when looking strictly at the project root path
      return <ProjectDashboardView />;
    }

    // 🎯 2. Secondary Priority: If there's a projectId in the URL but no pageId, show the Roadmap or Dashboard
    if (projectId) {
      // 💡 If your sidebar's "Kanban" button sets view mode to PageKanban when no page is active,
      // or if you want the project root view to be the overview roadmap:
      if (activeViewMode === WorkspaceViewMode.PageKanban) {
        return <PageKanbanView />;
      }

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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-slate-100">
      <aside className="w-64 h-full border-r border-slate-800/60 bg-zinc-900 shrink-0">
        <Sidebar />
      </aside>

      <div
        className={`flex-1 h-full custom-scrollbar ${
          activeViewMode === WorkspaceViewMode.PageDocument
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
