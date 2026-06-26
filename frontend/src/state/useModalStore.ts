import { create } from 'zustand';
import type { CommandMenuType } from './types';

// 🎯 Define an extended position type that optionally holds a connection target string
interface MenuPosition {
  top: number;
  left: number;
  arrowConnectionId?: string; // 👈 Add this optional metadata field
}

interface ModalState {
  activeMenuId: CommandMenuType | null;
  openMenu: (id: CommandMenuType, position: MenuPosition) => void;
  closeMenu: () => void;
  position: MenuPosition | null;
}

export const useModalStore = create<ModalState>((set) => ({
  activeMenuId: null,
  position: null,
  openMenu: (id, position) => set({ activeMenuId: id, position }),
  closeMenu: () => set({ activeMenuId: null, position: null }),
}));
