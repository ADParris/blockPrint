import type { LayoutModeType, StoreSlice } from './types';

export interface CanvasSlice {
  setLayoutMode: (mode: LayoutModeType) => void;
  cameraOffset: { x: number; y: number };
  zoomScale: number;
  setCameraOffset: (
    offset:
      | { x: number; y: number }
      | ((prev: { x: number; y: number }) => { x: number; y: number }),
  ) => void;
  setZoomScale: (scale: number | ((prev: number) => number)) => void;
  updateBlockPosition: (
    blockId: string,
    position: { x: number; y: number },
  ) => void;

  // 🎯 Updated signatures to match our 2-argument implementation contract!
  addBlockConnection: (sourceId: string, targetId: string) => void;
  removeBlockConnection: (sourceId: string, targetId: string) => void;
}

export const createCanvasSlice: StoreSlice<CanvasSlice> = (set, get) => ({
  // 1. Initial State Values
  cameraOffset: { x: 0, y: 0 },
  zoomScale: 1,
  setLayoutMode: (mode) => {
    const activeNotebookId = get().activeNotebookId;
    if (!activeNotebookId) return;

    set((state) => ({
      notebooks: state.notebooks.map((nb) =>
        nb.id === activeNotebookId ? { ...nb, layoutMode: mode } : nb,
      ),
    }));
  },

  // 2. Camera Viewport Actions
  setCameraOffset: (offset) => {
    const nextOffset =
      typeof offset === 'function' ? offset(get().cameraOffset) : offset;
    set({ cameraOffset: nextOffset });
  },

  setZoomScale: (scale) => {
    const nextScale =
      typeof scale === 'function' ? scale(get().zoomScale) : scale;
    set({ zoomScale: nextScale });
  },

  // 3. Coordinate Update Engine
  updateBlockPosition: (blockId, position) => {
    const activeNotebookId = get().activeNotebookId;
    if (!activeNotebookId) return;

    set((state) => ({
      notebooks: state.notebooks.map((nb) => {
        if (nb.id !== activeNotebookId) return nb;
        return {
          ...nb,
          blocks: nb.blocks.map((block) => {
            if (block.id !== blockId) return block;
            return {
              ...block,
              position: {
                ...block.position,
                ...position,
              },
            };
          }),
        };
      }),
    }));
  },

  addBlockConnection: (sourceId, targetId) => {
    set((state) => {
      const updatedNotebooks = state.notebooks.map((notebook) => {
        if (notebook.id !== state.activeNotebookId) return notebook;

        return {
          ...notebook,
          blocks: notebook.blocks.map((block) => {
            if (block.id !== sourceId) return block;

            // Prevent duplicate connections
            const currentConnections = block.connections ?? [];
            if (currentConnections.includes(targetId)) return block;

            return {
              ...block,
              connections: [...currentConnections, targetId],
            };
          }),
        };
      });

      return { notebooks: updatedNotebooks };
    });
  },

  removeBlockConnection: (sourceId, targetId) => {
    set((state) => {
      const updatedNotebooks = state.notebooks.map((notebook) => {
        if (notebook.id !== state.activeNotebookId) return notebook;

        return {
          ...notebook,
          blocks: notebook.blocks.map((block) => {
            if (block.id !== sourceId) return block;

            return {
              ...block,
              connections: (block.connections ?? []).filter(
                (id) => id !== targetId,
              ),
            };
          }),
        };
      });

      return { notebooks: updatedNotebooks };
    });
  },
});
