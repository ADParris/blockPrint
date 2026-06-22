import type { KeyboardEvent } from 'react';

interface Block {
  id: string;
  type: string;
  content: string;
}

interface UseCanvasKeyboardProps {
  blocks: Block[];
  activeBlockId: string;
  setActiveBlockId: (id: string) => void;
  updateBlockContent: (id: string, newContent: string) => void;
  insertBlockAtIndex: (index: number, initialContent?: string) => string;
  deleteBlock: (id: string) => void;
  isOpen: boolean;
  openMenu: (position: { top: number; left: number }) => void;
  handleClose: () => void;
}

const useCanvasKeyboard = ({
  blocks,
  setActiveBlockId,
  updateBlockContent,
  insertBlockAtIndex,
  deleteBlock,
  isOpen,
  openMenu,
  handleClose,
}: UseCanvasKeyboardProps) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const blockId = target.getAttribute('data-block-id');
    if (!blockId) return;

    // 1. Slash Menu (/) Trigger
    if (e.key === '/') {
      if (target.selectionStart === 0) {
        const rect = target.getBoundingClientRect();
        const top = window.scrollY + rect.bottom + 4;
        const left = window.scrollX + rect.left;
        openMenu({ top, left });
      }
    }

    // 2. Escape Menu Closure
    if (e.key === 'Escape' && isOpen) {
      handleClose();
    }

    // 3. Enter Key Flow
    if (e.key === 'Enter') {
      if (blockId === 'header-title') {
        return; // Let the browser submit or blur naturally
      }
      if (isOpen) {
        e.preventDefault();
        return;
      }
      if (e.shiftKey) {
        return;
      }
      e.preventDefault();

      // 💡 1. Grab the cursor position details from the active element
      const target = e.target as HTMLTextAreaElement;
      const currentText = target.value || '';
      const cursorPosition = target.selectionStart ?? 0;

      // 💡 2. Slice the text fragment cleanly into two halves
      const leftText = currentText.substring(0, cursorPosition);
      const rightText = currentText.substring(cursorPosition);

      // 💡 3. Keep the left half in the current block
      updateBlockContent(blockId, leftText);

      const currentBlockIndex = blocks.findIndex(
        (block) => block.id === blockId,
      );

      // 💡 4. Pass the right half down as the starting content for the new block!
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
    }

    // 4. Arrow Up Navigation
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
        }
      }
    }

    // 5. Arrow Down Navigation
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
        }
      }
    }

    // 6. Backspace Block Deletion & Menu Tracking
    if (e.key === 'Backspace') {
      // 🎯 FIX: If backspace is pressed inside the header title, completely skip
      // the canvas sibling-merge logic and let the header's native/local handlers rule.
      if (blockId === 'header-title') {
        return;
      }

      // 🎯 FIX: If text is highlighted inside the block, let the browser delete the text natively.
      // Do not preventDefault or trigger an early block-merge/vaporization!
      if (target.selectionStart !== target.selectionEnd) {
        return;
      }

      const cursorPosition = target.selectionStart ?? 0;

      // Trigger merge/delete whenever the cursor is at the very beginning of the cell
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
        } else {
          // If it's the very first block in the canvas and empty, just remove it safely
          if (target.value === '') {
            deleteBlock(blockId);
            setActiveBlockId('');
          }
        }
      }

      if (target.value === '/') {
        handleClose();
      }
    }
  };

  return { handleKeyDown };
};

export default useCanvasKeyboard;
