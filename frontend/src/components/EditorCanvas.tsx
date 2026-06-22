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

  // 1. Get the notebook reference (might be undefined initially)
  const notebook = getActiveNotebook();

  // 2. Fetch Modal store configurations
  const {
    activeMenuId,
    openMenu,
    closeMenu,
    position: menuPosition,
  } = useModalStore((state) => state);

  const handleClose = useCallback(() => {
    closeMenu();
  }, [closeMenu]);

  // 3. Initialize your keyboard controller
  // 🛡️ Safe Option: If notebook is missing, we pass an empty array '[]' so it doesn't crash!
  const { handleKeyDown } = useCanvasKeyboard({
    blocks: notebook ? notebook.blocks : [],
    activeBlockId,
    setActiveBlockId,
    insertBlockAtIndex,
    deleteBlock,
    updateBlockContent,
    isOpen: activeMenuId === 'canvas-command',
    openMenu: (position) => openMenu('canvas-command', position),
    handleClose,
  });

  // 4. 🛡️ The Guard Gate! All hooks have run, so now it is 100% legal to return early.
  if (!notebook) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        <div className="text-center">
          <p className="font-medium">No notebook selected</p>
          <p className="text-sm text-slate-500 mt-1">
            Select a notebook from the sidebar to begin editing.
          </p>
        </div>
      </div>
    );
  }

  // 5. Normal UI Event Handlers (Safe to assume notebook exists below this line)
  const handleCanvasClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    const dragHandle = target.closest('[data-drag-handle-for]');
    if (dragHandle) {
      const targetBlockId = dragHandle.getAttribute('data-drag-handle-for');
      if (targetBlockId) {
        e.stopPropagation();
        setActiveBlockId(targetBlockId);

        const rect = dragHandle.getBoundingClientRect();
        const top = window.scrollY + rect.bottom + 4;
        const left = window.scrollX + rect.left;

        openMenu('canvas-command', { top, left });
        return;
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
