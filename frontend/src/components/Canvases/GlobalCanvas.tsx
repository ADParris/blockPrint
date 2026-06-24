import React, { useRef } from 'react';
import { useCanvasKeyboard } from '../../hooks/useCanvasKeyboard';
import type { CommandMenuType } from '../../state/types';
import { CommandMenu, LayoutMode } from '../../state/types';
import { useCanvasStore } from '../../state/useCanvasStore';
import { useModalStore } from '../../state/useModalStore';
import ArrowCommandMenu from '../ArrowCommandMenu';
import BlockCommandMenu from '../BlockCommandMenu';
import Modal from '../Modal';
import DocumentCanvas from './DocumentCanvas';
import SpatialCanvas from './SpatialCanvas';

export const GlobalCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Grab your view state and actions from Zustand
  const {
    activeBlockId,
    isLoading,
    setActiveBlockId,
    insertBlockAtIndex,
    getActiveNotebook,
  } = useCanvasStore();

  const { activeMenuId, position, openMenu, closeMenu } = useModalStore();

  const notebook = getActiveNotebook();
  const layoutMode = notebook?.layoutMode ?? LayoutMode.DocumentCanvas;

  const handleCanvasClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // 1. Check for Drag Handle / Command Menu Trigger
    const dragHandle = target.closest('[data-drag-handle-for]');
    if (dragHandle) {
      const targetBlockId = dragHandle.getAttribute('data-drag-handle-for');
      if (targetBlockId) {
        e.stopPropagation();
        setActiveBlockId(targetBlockId);

        const rect = dragHandle.getBoundingClientRect();

        // Calculate coordinate offsets relative to our managed canvas layout wrapper
        const containerRect = containerRef.current?.getBoundingClientRect();
        const top = rect.bottom - (containerRect?.top ?? 0) + 4;
        const left = rect.left - (containerRect?.left ?? 0);

        openMenu(CommandMenu.BlockCommand, { top, left });
        return;
      }
    }

    // 2. Safe zone bail-outs (clicking active UI fields shouldn't reset state)
    if (
      target.closest('[data-block-id]') ||
      target.closest('.group\\/code') ||
      target.closest('.header-group')
    ) {
      return;
    }

    // 3. Clear focus if clicking empty canvas whitespace
    if (activeBlockId !== '') {
      setActiveBlockId('');
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      return;
    }

    // 4. Document-only: Append new block when clicking below content area
    if (layoutMode === LayoutMode.DocumentCanvas && notebook) {
      const pElements =
        containerRef.current?.querySelectorAll('[data-block-id]');
      const lastBlock = pElements?.[pElements.length - 1];

      let isClickingBelowLastBlock = false;
      if (lastBlock) {
        const lastBlockRect = lastBlock.getBoundingClientRect();
        if (e.clientY > lastBlockRect.bottom) {
          isClickingBelowLastBlock = true;
        }
      } else {
        isClickingBelowLastBlock = true;
      }

      if (isClickingBelowLastBlock) {
        const newBlockId = insertBlockAtIndex(notebook.blocks.length);
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

  // Unified keyboard navigation
  const { handleKeyDown } = useCanvasKeyboard();

  const currentMenu = (activeMenuId: string) => {
    switch (activeMenuId) {
      case CommandMenu.ArrowCommand:
        return (
          <ArrowCommandMenu connectionId={activeMenuId} onClose={closeMenu} />
        );

      case CommandMenu.BlockCommand:
        return <BlockCommandMenu />;

      default:
        return (
          <div className="p-4 text-xs text-slate-400">
            Unknown Menu: ({activeMenuId})
          </div>
        );
    }
  };

  const isValidMenu = activeMenuId
    ? Object.values(CommandMenu).includes(activeMenuId as CommandMenuType)
    : false;

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="text-lg font-medium animate-pulse">
          Loading blocks...
        </div>
      </div>
    );
  }

  return (
    <main
      ref={containerRef}
      className="relative w-full h-full outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={handleCanvasClick} // 👈 Captures all bubbling clicks centrally!
    >
      {layoutMode === LayoutMode.DocumentCanvas ? (
        <DocumentCanvas />
      ) : (
        <SpatialCanvas />
      )}

      {isValidMenu && activeMenuId && (
        <Modal menuPosition={position} onClose={closeMenu}>
          {currentMenu(activeMenuId)}
        </Modal>
      )}
    </main>
  );
};
