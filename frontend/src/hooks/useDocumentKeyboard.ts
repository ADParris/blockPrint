// src/hooks/useDocumentKeyboard.ts
import type { KeyboardEvent } from 'react';
import { useModalStore } from '../state/useModalStore';
import { useProjectStore } from '../state/useProjectStore';

// 🎯 Accept the active context parameters directly as arguments
export const useDocumentKeyboard = (
  projectId: string | undefined,
  pageId: string | undefined,
  isDocumentView: boolean,
) => {
  // 🎯 1. Clean, atomic selector subscriptions
  const pages = useProjectStore((state) => state.pages);
  const updateBlockContent = useProjectStore(
    (state) => state.updateBlockContent,
  );
  const updateBlockType = useProjectStore((state) => state.updateBlockType);
  const insertBlockAtIndex = useProjectStore(
    (state) => state.insertBlockAtIndex,
  );
  const deleteBlock = useProjectStore((state) => state.deleteBlock);
  const setActiveBlockId = useProjectStore((state) => state.setActiveBlockId);

  // Menu/Modal overlay contexts
  const activeMenuId = useModalStore((state) => state.activeMenuId);
  const closeMenu = useModalStore((state) => state.closeMenu);

  return (e: KeyboardEvent<HTMLElement>): boolean => {
    // 🎯 2. Guard against out-of-bounds layout views instantly using the passed flag
    if (!isDocumentView || !projectId || !pageId) return false;

    // Resolve the current block array safely using our parameters
    const projectPages = pages[projectId] || [];
    const currentPage = projectPages.find((page) => page.id === pageId);
    const blocks = currentPage?.blocks || [];

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

      // Find current block to see if we should carry over a list type
      const currentBlockIndex = blocks.findIndex(
        (block) => block.id === blockId,
      );
      const currentBlock = blocks[currentBlockIndex];

      // Perpetuate list type if we are currently inside one
      const nextBlockType =
        currentBlock?.type === 'bullet' || currentBlock?.type === 'number'
          ? currentBlock.type
          : 'p';

      updateBlockContent(projectId, pageId, blockId, leftText);

      const newBlockId = insertBlockAtIndex(
        projectId,
        pageId,
        currentBlockIndex + 1,
        rightText,
        nextBlockType, // 🎯 Pass the type forward
      );

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
        const currentBlock = blocks[currentBlockIndex];

        // 🎯 Intercept list blocks first!
        if (
          currentBlock &&
          (currentBlock.type === 'bullet' || currentBlock.type === 'number')
        ) {
          const currentCursor = target.selectionStart ?? 0;

          // Revert type back to standard paragraph
          updateBlockType(projectId, pageId, blockId, 'p');

          // ⚡ Force focus back onto the newly rendered paragraph textarea
          setTimeout(() => {
            const currentElement = document.querySelector(
              `textarea[data-block-id="${blockId}"]`,
            ) as HTMLTextAreaElement;
            if (currentElement) {
              currentElement.focus();
              currentElement.setSelectionRange(currentCursor, currentCursor);
            }
          }, 0);
          return true;
        }

        // --- Standard Deletion & Merging (Only runs if it's already a standard block) ---
        if (currentBlockIndex > 0) {
          const previousBlock = blocks[currentBlockIndex - 1];
          const currentBlockContent = target.value || '';
          const originalPreviousLength = previousBlock.content?.length || 0;
          const mergedContent =
            (previousBlock.content || '') + currentBlockContent;

          updateBlockContent(
            projectId,
            pageId,
            previousBlock.id,
            mergedContent,
          );
          deleteBlock(projectId, pageId, blockId);
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
            deleteBlock(projectId, pageId, blockId);
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
