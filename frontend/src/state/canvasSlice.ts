// src/state/canvasSlice.ts
import type { AnchorDirection, LayoutModeType, StoreSlice } from './types';

// 🎯 CENTRALIZED KEY UTILITIES
export const createConnectionKey = (
  sourceId: string,
  targetId: string,
  sourceDir: AnchorDirection,
  targetDir: AnchorDirection,
): string => {
  return `conn__${sourceId}__${targetId}__${sourceDir}__${targetDir}`;
};

const parseConnectionKey = (key: string) => {
  const parts = key.split('__');
  if (parts.length < 5) return null;
  const [, sourceId, targetId, sourceDir, targetDir] = parts;
  return {
    sourceId,
    targetId,
    sourceDir: sourceDir as AnchorDirection,
    targetDir: targetDir as AnchorDirection,
  };
};

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
  addBlockConnectionByKey: (connectionKey: string) => void;
  removeBlockConnectionByKey: (connectionKey: string) => void;
}

export const createCanvasSlice: StoreSlice<CanvasSlice> = (set, get) => ({
  cameraOffset: { x: 0, y: 0 },
  zoomScale: 1,

  setLayoutMode: (mode) => {
    const { activeProjectId, activePageId, pages } = get();
    if (!activeProjectId || !activePageId || !pages[activeProjectId]) return;

    const updatedPages = pages[activeProjectId].map((page) => {
      if (page.id !== activePageId) return page;
      return {
        ...page,
        layoutMode: mode,
        lastEditedBy: {
          userId: get().currentUser?.id || 'unknown',
          userName: get().currentUser?.name || 'Unknown',
          timestamp: Date.now(),
        },
      };
    });

    set({ pages: { ...pages, [activeProjectId]: updatedPages } });
  },

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

  updateBlockPosition: (blockId, position) => {
    const { activeProjectId, activePageId, pages } = get();
    if (!activeProjectId || !activePageId || !pages[activeProjectId]) return;

    const updatedPages = pages[activeProjectId].map((page) => {
      if (page.id !== activePageId) return page;
      return {
        ...page,
        blocks: page.blocks.map((block) => {
          if (block.id !== blockId) return block;
          return {
            ...block,
            position: {
              ...block.position,
              ...position,
            },
          };
        }),
        lastEditedBy: {
          userId: get().currentUser?.id || 'unknown',
          userName: get().currentUser?.name || 'Unknown',
          timestamp: Date.now(),
        },
      };
    });

    set({ pages: { ...pages, [activeProjectId]: updatedPages } });
  },

  addBlockConnectionByKey: (connectionKey) => {
    const parsed = parseConnectionKey(connectionKey);
    if (!parsed) return;

    // 🎯 FIX: Extracted targetDir cleanly out of the parsed key object
    const { sourceId, targetId, sourceDir, targetDir } = parsed;
    const { activeProjectId, activePageId, pages } = get();
    if (!activeProjectId || !activePageId || !pages[activeProjectId]) return;

    const updatedPages = pages[activeProjectId].map((page) => {
      if (page.id !== activePageId) return page;

      return {
        ...page,
        blocks: page.blocks.map((block) => {
          if (block.id !== sourceId) return block;

          const currentConnections = block.connections ?? [];
          // 🎯 ENHANCEMENT: Duplication check now looks at both directions
          const exists = currentConnections.some(
            (c) =>
              c.targetId === targetId &&
              c.sourceDir === sourceDir &&
              c.targetDir === targetDir,
          );
          if (exists) return block;

          return {
            ...block,
            connections: [
              ...currentConnections,
              { targetId, sourceDir, targetDir },
            ],
          };
        }),
        lastEditedBy: {
          userId: get().currentUser?.id || 'unknown',
          userName: get().currentUser?.name || 'Unknown',
          timestamp: Date.now(),
        },
      };
    });

    set({ pages: { ...pages, [activeProjectId]: updatedPages } });
  },

  removeBlockConnectionByKey: (connectionKey) => {
    const parsed = parseConnectionKey(connectionKey);
    if (!parsed) return;

    // 🎯 ENHANCEMENT: Destructure targetDir for explicit cleanup matching
    const { sourceId, targetId, sourceDir, targetDir } = parsed;
    const { activeProjectId, activePageId, pages } = get();
    if (!activeProjectId || !activePageId || !pages[activeProjectId]) return;

    const updatedPages = pages[activeProjectId].map((page) => {
      if (page.id !== activePageId) return page;

      return {
        ...page,
        blocks: page.blocks.map((block) => {
          if (block.id !== sourceId) return block;

          const currentConnections = block.connections ?? [];
          return {
            ...block,
            connections: currentConnections.filter(
              (c) =>
                !(
                  c.targetId === targetId &&
                  c.sourceDir === sourceDir &&
                  c.targetDir === targetDir
                ),
            ),
          };
        }),
        lastEditedBy: {
          userId: get().currentUser?.id || 'unknown',
          userName: get().currentUser?.name || 'Unknown',
          timestamp: Date.now(),
        },
      };
    });

    set({ pages: { ...pages, [activeProjectId]: updatedPages } });
  },
});
