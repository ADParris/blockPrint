import { create } from 'zustand';

interface ModalState {
  activeMenuId: string | null; // 💡 Tracks EXACTLY who is open (e.g., 'canvas-command' or 'sidebar-notebook-123')
  openMenu: (id: string, position: { top: number; left: number }) => void;
  closeMenu: () => void;
  position: { top: number; left: number } | null;
}

const useModalStore = create<ModalState>((set) => ({
  activeMenuId: null,
  position: null,
  openMenu: (id, position) => set({ activeMenuId: id, position }),
  closeMenu: () => set({ activeMenuId: null, position: null }),
}));

export default useModalStore;
