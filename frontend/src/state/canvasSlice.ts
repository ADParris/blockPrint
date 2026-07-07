// src/state/canvasSlice.ts
import type { AnchorDirection, StoreSlice, HoveredCanvasTarget } from './types';

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
  cameraOffset: { x: number; y: number };
  zoomScale: number;
  // 🎯 Track which port anchor is currently being hovered during a line drag
  hoveredTarget: HoveredCanvasTarget | null;
  setCameraOffset: (
    offset:
      | { x: number; y: number }
      | ((prev: { x: number; y: number }) => { x: number; y: number }),
  ) => void;
  setZoomScale: (scale: number | ((prev: number) => number)) => void;
  setHoveredTarget: (target: HoveredCanvasTarget | null) => void;
  updateBlockPosition: (
    projectId: string | undefined,
    pageId: string | undefined,
    blockId: string,
    position: { x: number; y: number },
  ) => void;
  addBlockConnectionByKey: (
    projectId: string | undefined,
    pageId: string | undefined,
    connectionKey: string,
  ) => void;
  removeBlockConnectionByKey: (
    projectId: string | undefined,
    pageId: string | undefined,
    connectionKey: string,
  ) => void;
  updateBlockConnectionColor: (
    projectId: string | undefined,
    pageId: string | undefined,
    connectionKey: string,
    color: 'blue' | 'emerald' | 'rose' | 'amber',
  ) => void;
}

export const createCanvasSlice: StoreSlice<CanvasSlice> = (set, get) => ({
  cameraOffset: { x: 0, y: 0 },
  zoomScale: 1,
  hoveredTarget: null, // Initial state

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

  setHoveredTarget: (target) => {
    set({ hoveredTarget: target });
  },

  updateBlockPosition: (projectId, pageId, blockId, position) => {
    const { pages } = get();
    if (!projectId || !pageId || !pages[projectId]) return;

    const updatedPages = pages[projectId].map((page) => {
      if (page.id !== pageId) return page;
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

    set({ pages: { ...pages, [projectId]: updatedPages } });
  },

  addBlockConnectionByKey: (projectId, pageId, connectionKey) => {
    const parsed = parseConnectionKey(connectionKey);
    if (!parsed) return;

    const { sourceId, targetId, sourceDir, targetDir } = parsed;
    const { pages } = get();
    if (!projectId || !pageId || !pages[projectId]) return;

    const updatedPages = pages[projectId].map((page) => {
      if (page.id !== pageId) return page;

      return {
        ...page,
        blocks: page.blocks.map((block) => {
          if (block.id !== sourceId) return block;

          const currentConnections = block.connections ?? [];
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

    set({ pages: { ...pages, [projectId]: updatedPages } });
  },

  removeBlockConnectionByKey: (projectId, pageId, connectionKey) => {
    const parsed = parseConnectionKey(connectionKey);
    if (!parsed) return;

    const { sourceId, targetId, sourceDir, targetDir } = parsed;
    const { pages } = get();
    if (!projectId || !pageId || !pages[projectId]) return;

    const updatedPages = pages[projectId].map((page) => {
      if (page.id !== pageId) return page;

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

    set({ pages: { ...pages, [projectId]: updatedPages } });
  },

  updateBlockConnectionColor: (projectId, pageId, connectionKey, color) => {
    const parsed = parseConnectionKey(connectionKey);
    if (!parsed) return;

    const { sourceId, targetId, sourceDir, targetDir } = parsed;
    const { pages } = get();
    if (!projectId || !pageId || !pages[projectId]) return;

    const updatedPages = pages[projectId].map((page) => {
      if (page.id !== pageId) return page;

      return {
        ...page,
        blocks: page.blocks.map((block) => {
          if (block.id !== sourceId) return block;

          return {
            ...block,
            connections: (block.connections ?? []).map((c) => {
              if (
                c.targetId === targetId &&
                c.sourceDir === sourceDir &&
                c.targetDir === targetDir
              ) {
                return { ...c, color };
              }
              return c;
            }),
          };
        }),
      };
    });

    set({ pages: { ...pages, [projectId]: updatedPages } });
  },
});
