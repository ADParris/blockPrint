// src/hooks/useDocumentKeyboard.ts
import type { KeyboardEvent } from 'react';
import { LayoutMode } from '../state/types';
import { useModalStore } from '../state/useModalStore';
import { useProjectStore } from '../state/useProjectStore';

export const useDocumentKeyboard = () => {
  // 1. Grab modern active collections and parameters from the central store
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const activePageId = useProjectStore((state) => state.activePageId);
  const pages = useProjectStore((state) => state.pages);

  // Core modification actions
  const updateBlockContent = useProjectStore(
    (state) => state.updateBlockContent,
  );
  const insertBlockAtIndex = useProjectStore(
    (state) => state.insertBlockAtIndex,
  );
  const deleteBlock = useProjectStore((state) => state.deleteBlock);
  const setActiveBlockId = useProjectStore((state) => state.setActiveBlockId);

  // Menu/Modal overlay contexts
  const activeMenuId = useModalStore((state) => state.activeMenuId);
  const closeMenu = useModalStore((state) => state.closeMenu);

  return (e: KeyboardEvent<HTMLElement>): boolean => {
    // 2. Resolve the active page object safely at the runtime execution frame
    const projectPages = pages[activeProjectId || ''] || [];
    const currentPage = projectPages.find((page) => page.id === activePageId);

    const layoutMode = currentPage?.layoutMode;
    const blocks = currentPage?.blocks || [];

    // 3. Bail immediately if we aren't in linear Document Mode
    if (layoutMode !== LayoutMode.DocumentCanvas) return false;

    const target = e.target as HTMLTextAreaElement;
    const blockId = target.getAttribute('data-block-id');
    if (!blockId) return false;

    // --- Enter Key Flow ---
    if (e.key === 'Enter') {
      if (blockId === 'header-title') return false;
      if (activeMenuId) {
        e.preventDefault();
        return true;
      }
      if (e.shiftKey) return false;

      e.preventDefault();
      const currentText = target.value || '';
      const cursorPosition = target.selectionStart ?? 0;

      const leftText = currentText.substring(0, cursorPosition);
      const rightText = currentText.substring(cursorPosition);

      updateBlockContent(blockId, leftText);
      const currentBlockIndex = blocks.findIndex(
        (block) => block.id === blockId,
      );
      const newBlockId = insertBlockAtIndex(currentBlockIndex + 1, rightText);

      setTimeout(() => {
        const nextTextarea = document.querySelector(
          `textarea[data-block-id="${newBlockId}"]`,
        ) as HTMLTextAreaElement;
        if (nextTextarea) {
          nextTextarea.focus();
          nextTextarea.setSelectionRange(0, 0);
        }
      }, 50);
      return true;
    }

    // --- Arrow Up Navigation ---
    if (e.key === 'ArrowUp') {
      if (target.selectionStart === 0) {
        const currentBlockIndex = blocks.findIndex(
          (block) => block.id === blockId,
        );
        if (currentBlockIndex > 0) {
          e.preventDefault();
          const prevBlock = blocks[currentBlockIndex - 1];
          setTimeout(() => {
            const prevElement = document.querySelector(
              `textarea[data-block-id="${prevBlock.id}"]`,
            ) as HTMLTextAreaElement;
            if (prevElement) {
              prevElement.focus();
              prevElement.setSelectionRange(
                prevElement.value.length,
                prevElement.value.length,
              );
            }
          }, 0);
          return true;
        }
      }
    }

    // --- Arrow Down Navigation ---
    if (e.key === 'ArrowDown') {
      if (target.selectionStart === target.value.length) {
        const currentBlockIndex = blocks.findIndex(
          (block) => block.id === blockId,
        );
        if (currentBlockIndex < blocks.length - 1) {
          e.preventDefault();
          const nextBlock = blocks[currentBlockIndex + 1];
          setTimeout(() => {
            const nextElement = document.querySelector(
              `textarea[data-block-id="${nextBlock.id}"]`,
            ) as HTMLTextAreaElement;
            if (nextElement) {
              nextElement.focus();
              nextElement.setSelectionRange(0, 0);
            }
          }, 0);
          return true;
        }
      }
    }

    // --- Backspace Block Deletion ---
    if (e.key === 'Backspace') {
      if (blockId === 'header-title') return false;
      if (target.selectionStart !== target.selectionEnd) return false;

      const cursorPosition = target.selectionStart ?? 0;

      if (cursorPosition === 0) {
        e.preventDefault();
        const currentBlockIndex = blocks.findIndex(
          (block) => block.id === blockId,
        );

        if (currentBlockIndex > 0) {
          const previousBlock = blocks[currentBlockIndex - 1];
          const currentBlockContent = target.value || '';
          const originalPreviousLength = previousBlock.content?.length || 0;
          const mergedContent =
            (previousBlock.content || '') + currentBlockContent;

          updateBlockContent(previousBlock.id, mergedContent);
          deleteBlock(blockId);
          setActiveBlockId(previousBlock.id);

          setTimeout(() => {
            const prevElement = document.querySelector(
              `textarea[data-block-id="${previousBlock.id}"]`,
            ) as HTMLTextAreaElement;
            if (prevElement) {
              prevElement.focus();
              prevElement.setSelectionRange(
                originalPreviousLength,
                originalPreviousLength,
              );
            }
          }, 0);
          return true;
        } else {
          if (target.value === '') {
            deleteBlock(blockId);
            setActiveBlockId('');
            return true;
          }
        }
      }

      if (target.value === '/') {
        closeMenu();
        return true;
      }
    }

    return false;
  };
};
