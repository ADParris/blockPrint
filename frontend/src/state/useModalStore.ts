import { create } from 'zustand';
import type { CommandMenuType } from './types';

interface ModalState {
  activeMenuId: CommandMenuType | null;
  openMenu: (
    id: CommandMenuType,
    position: { top: number; left: number },
  ) => void;
  closeMenu: () => void;
  position: { top: number; left: number } | null;
}

export const useModalStore = create<ModalState>((set) => ({
  activeMenuId: null,
  position: null,
  openMenu: (id, position) => set({ activeMenuId: id, position }),
  closeMenu: () => set({ activeMenuId: null, position: null }),
}));
