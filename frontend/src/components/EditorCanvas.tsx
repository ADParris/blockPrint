import React, { useCallback } from 'react';
import useCanvasKeyboard from '../hooks/useCanvasKeyboard';
import useCanvasStore from '../state/useCanvasStore';
import useModalStore from '../state/useModalStore';
import BlockCommandMenu from './BlockCommandMenu';
import BlockRenderer from './BlockRenderer';
import Modal from './Modal';
import NotebookHeader from './NotebookHeader';
import SortableList from './SortableList';

export const EditorCanvas: React.FC = () => {
  const {
    activeBlockId,
    deleteBlock,
    getActiveNotebook,
    insertBlockAtIndex,
    moveBlockToIndex,
    setActiveBlockId,
    updateBlockContent,
  } = useCanvasStore((state) => state);

  const notebook = getActiveNotebook();

  const {
    activeMenuId,
    openMenu,
    closeMenu,
    position: menuPosition,
  } = useModalStore((state) => state);

  const handleClose = useCallback(() => {
    closeMenu();
  }, [closeMenu]);

  const { handleKeyDown } = useCanvasKeyboard({
    blocks: notebook.blocks,
    activeBlockId,
    setActiveBlockId,
    insertBlockAtIndex,
    deleteBlock,
    updateBlockContent,
    isOpen: activeMenuId === 'canvas-command', // From command menu state
    openMenu: (position) => openMenu('canvas-command', position), // From command menu state
    handleClose, // From command menu state
  });

  const handleCanvasClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // 💡 1. Catch if the user clicked our drag handle (Check this first!)
    const dragHandle = target.closest('[data-drag-handle-for]');
    if (dragHandle) {
      const targetBlockId = dragHandle.getAttribute('data-drag-handle-for');
      if (targetBlockId) {
        e.stopPropagation();

        // Set this block as active so the menu knows who to mutate
        setActiveBlockId(targetBlockId);

        // Position the menu right next to the drag handle button
        const rect = dragHandle.getBoundingClientRect();
        const top = window.scrollY + rect.bottom + 4;
        const left = window.scrollX + rect.left;

        openMenu('canvas-command', { top, left });
        return; // 🛑 Stop here. Don't evaluate background click rules.
      }
    }

    // 2. If clicking inside a text or code cell, ignore background logic
    if (
      target.closest('[data-block-id]') ||
      target.closest('.group\\/code') ||
      target.closest('.header-group') // 🎯 Protects the entire header container bounds
    ) {
      return;
    }

    // 3. Clear active focus if clicking empty canvas while a block is active
    if (activeBlockId !== '') {
      setActiveBlockId('');
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      return;
    }

    // 4. Spawn a new block at the bottom if clicking below the last block
    const allBlocks = document.querySelectorAll('[data-block-id]');
    const lastBlock = allBlocks[allBlocks.length - 1];

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
        const nextTextarea = document.querySelector(
          `textarea[data-block-id="${newBlockId}"]`,
        ) as HTMLTextAreaElement;

        if (nextTextarea) {
          nextTextarea.focus();
          nextTextarea.setSelectionRange(0, 0);
        }
      }, 50);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLElement>) => {
    const blockId = e.target.getAttribute('data-block-id');
    if (blockId) {
      setActiveBlockId(blockId);
    }
  };

  const handleContentChange = (e: React.FocusEvent<HTMLElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const blockId = target.getAttribute('data-block-id');
    const text = target.value;

    if (blockId) {
      updateBlockContent(blockId, text);
    }
  };

  return (
    <div className="max-w-3xl mx-auto" onClick={handleCanvasClick}>
      <div
        className="max-w-3xl mx-auto flex flex-col gap-2 pointer-events-auto"
        onBlur={handleContentChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
      >
        <NotebookHeader notebook={notebook} />
        <SortableList
          items={notebook.blocks}
          onMoveItem={moveBlockToIndex}
          renderItem={(block) => <BlockRenderer block={block} />}
        />
        <div className="h-[40vh]" />
      </div>

      {activeMenuId === 'canvas-command' && (
        <Modal handleClose={handleClose} menuPosition={menuPosition}>
          <BlockCommandMenu />
        </Modal>
      )}
    </div>
  );
};
