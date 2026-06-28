// src/components/Canvases/GlobalCanvas.tsx
import React, { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCanvasKeyboard } from '../../hooks/useCanvasKeyboard';
import type { CommandMenuType } from '../../state/types';
import { CommandMenu, LayoutMode } from '../../state/types';
import { useModalStore } from '../../state/useModalStore';
import { useProjectStore } from '../../state/useProjectStore';
import ArrowCommandMenu from '../ArrowCommandMenu';
import BlockCommandMenu from '../BlockCommandMenu';
import Modal from '../Modal';
import { ProjectDashboardView } from '../ProjectDashboardView';
import DocumentCanvas from './DocumentCanvas';
import SpatialCanvas from './SpatialCanvas';

export const GlobalCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // 🎯 1. Extract parameters straight from the browser URL address bar
  const { namespace, projectId, pageId } = useParams<{
    namespace: string;
    projectId?: string;
    pageId?: string;
  }>();

  // Fetch store methods and operational states
  const {
    projects,
    pages,
    activeBlockId,
    isLoading,
    setActiveBlockId,
    insertBlockAtIndex,
    // 💡 We can use these to sync up background logic if other components still look at the store
    setActiveProjectId,
    setActivePageId,
  } = useProjectStore();

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
        // Push them back to their root namespace view cleanly
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

  const layoutMode = activePage?.layoutMode ?? LayoutMode.DocumentCanvas;

  const handleCanvasClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    if (target.closest('[data-drag-handle-for]')) {
      const dragHandle = target.closest('[data-drag-handle-for]');
      const targetBlockId = dragHandle?.getAttribute('data-drag-handle-for');
      if (targetBlockId) {
        e.stopPropagation();
        setActiveBlockId(targetBlockId);
        const dragHandle = target.closest('[data-drag-handle-for]');
        if (dragHandle) {
          const targetBlockId = dragHandle.getAttribute('data-drag-handle-for');
          if (targetBlockId) {
            e.stopPropagation();
            setActiveBlockId(targetBlockId);

            // 🎯 Use optional chaining or the verified 'dragHandle' reference safely
            const rect = dragHandle.getBoundingClientRect();
            const top = rect.bottom + 4;
            const left = rect.left;

            openMenu(CommandMenu.BlockCommand, { top, left });
            return;
          }
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

    if (layoutMode === LayoutMode.DocumentCanvas && activePage) {
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
    ? Object.values(CommandMenu).includes(activeMenuId as CommandMenuType) ||
      isArrowMenu
    : false;

  const currentMenu = (menuId: string) => {
    switch (menuId) {
      case CommandMenu.ArrowCommand:
        return (
          <ArrowCommandMenu
            connectionId={position?.arrowConnectionId ?? ''}
            onClose={closeMenu}
          />
        );
      case CommandMenu.BlockCommand:
        return <BlockCommandMenu />;
      default:
        return null;
    }
  };

  // 🎯 4. The Router-Driven View Switch Engine
  const currentLayout = () => {
    // 🎯 1. Highest Priority: If there's a pageId in the URL, immediately target the active canvas
    if (pageId) {
      if (!activePage) {
        return (
          <div className="flex h-full w-full items-center justify-center bg-zinc-950 text-zinc-600 text-xs italic">
            Loading page canvas...
          </div>
        );
      }
      return layoutMode === LayoutMode.SpatialCanvas ? (
        <SpatialCanvas />
      ) : (
        <DocumentCanvas />
      );
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
