import type { KeyboardEvent } from 'react';
import { CommandMenus } from '../state/types';
import { useModalStore } from '../state/useModalStore';

export const useGlobalKeyboard = () => {
  const { activeMenuId, openMenu, closeMenu } = useModalStore((state) => state);

  return (e: KeyboardEvent<HTMLElement>): boolean => {
    const target = e.target as HTMLTextAreaElement;
    const blockId = target.getAttribute('data-block-id');

    // 1. Slash Menu (/) Trigger
    if (e.key === '/') {
      if (blockId && target.selectionStart === 0) {
        const rect = target.getBoundingClientRect();
        // Since it's mounted in GlobalCanvas, position it cleanly relative to layout viewport bounds
        const top = rect.bottom + 4;
        const left = rect.left;

        openMenu(CommandMenus.BlockCommand, { top, left });
        return true; // Short-circuit
      }
    }

    // 2. Escape Menu Closure
    if (e.key === 'Escape' && activeMenuId) {
      closeMenu();
      return true; // Short-circuit
    }

    return false;
  };
};
