// src/state/documentSlice.ts
import type { BlockType, CanvasBlock, StoreSlice } from './types';

export interface DocumentActions {
  insertBlockAtIndex: (
    projectId: string | undefined,
    pageId: string | undefined,
    targetIndex?: number,
    initialContent?: string,
  ) => string;
  updateBlockContent: (
    projectId: string | undefined,
    pageId: string | undefined,
    id: string,
    newContent: string,
  ) => void;
  updateBlockType: (
    projectId: string | undefined,
    pageId: string | undefined,
    id: string,
    newType: BlockType,
  ) => void;
  deleteBlock: (
    projectId: string | undefined,
    pageId: string | undefined,
    id: string,
  ) => void;
  setActiveBlockId: (id: string | null) => void;
  moveBlockToIndex: (
    projectId: string | undefined,
    pageId: string | undefined,
    activeId: string,
    targetIndex: number,
  ) => void;
}

export const createDocumentSlice: StoreSlice<DocumentActions> = (set, get) => ({
  insertBlockAtIndex: (projectId, pageId, targetIndex, initialContent = '') => {
    const newId = crypto.randomUUID();
    const newBlock: CanvasBlock = {
      id: newId,
      type: 'p',
      content: initialContent,
    };
    const { pages } = get();
    if (!projectId || !pageId || !pages[projectId]) return '';

    const updatedPages = pages[projectId].map((page) => {
      if (page.id !== pageId) return page;

      const updatedBlocks = [...page.blocks];
      const actualIndex = targetIndex ?? updatedBlocks.length;
      updatedBlocks.splice(actualIndex, 0, newBlock);

      return {
        ...page,
        blocks: updatedBlocks,
        lastEditedBy: {
          userId: get().currentUser?.id || 'unknown',
          userName: get().currentUser?.name || 'Unknown',
          timestamp: Date.now(),
        },
      };
    });

    set({ pages: { ...pages, [projectId]: updatedPages } });
    return newId;
  },

  updateBlockContent: (projectId, pageId, id, newContent) => {
    const { pages } = get();
    if (!projectId || !pageId || !pages[projectId]) return;

    const updatedPages = pages[projectId].map((page) => {
      if (page.id !== pageId) return page;
      return {
        ...page,
        blocks: page.blocks.map((b) =>
          b.id === id ? { ...b, content: newContent } : b,
        ),
        lastEditedBy: {
          userId: get().currentUser?.id || 'unknown',
          userName: get().currentUser?.name || 'Unknown',
          timestamp: Date.now(),
        },
      };
    });

    set({ pages: { ...pages, [projectId]: updatedPages } });
  },

  updateBlockType: (projectId, pageId, id, newType) => {
    const { pages } = get();
    if (!projectId || !pageId || !pages[projectId]) return;

    const updatedPages = pages[projectId].map((page) => {
      if (page.id !== pageId) return page;
      return {
        ...page,
        blocks: page.blocks.map((b) =>
          b.id === id ? { ...b, type: newType } : b,
        ),
        lastEditedBy: {
          userId: get().currentUser?.id || 'unknown',
          userName: get().currentUser?.name || 'Unknown',
          timestamp: Date.now(),
        },
      };
    });

    set({ pages: { ...pages, [projectId]: updatedPages } });
  },

  deleteBlock: (projectId, pageId, id) => {
    const { pages, activeBlockId } = get();
    if (!projectId || !pageId || !pages[projectId]) return;

    const updatedPages = pages[projectId].map((page) => {
      if (page.id !== pageId) return page;
      return {
        ...page,
        blocks: page.blocks.filter((b) => b.id !== id),
        lastEditedBy: {
          userId: get().currentUser?.id || 'unknown',
          userName: get().currentUser?.name || 'Unknown',
          timestamp: Date.now(),
        },
      };
    });

    set({
      pages: { ...pages, [projectId]: updatedPages },
      activeBlockId: activeBlockId === id ? null : activeBlockId,
    });
  },

  moveBlockToIndex: (projectId, pageId, activeId, targetIndex) => {
    const { pages } = get();
    if (!projectId || !pageId || !pages[projectId]) return;

    const updatedPages = pages[projectId].map((page) => {
      if (page.id !== pageId) return page;

      const oldIndex = page.blocks.findIndex((b) => b.id === activeId);
      if (oldIndex === -1) return page;

      const updatedBlocks = [...page.blocks];
      const [movedBlock] = updatedBlocks.splice(oldIndex, 1);
      const finalIndex = oldIndex < targetIndex ? targetIndex - 1 : targetIndex;
      updatedBlocks.splice(finalIndex, 0, movedBlock);

      return {
        ...page,
        blocks: updatedBlocks,
        lastEditedBy: {
          userId: get().currentUser?.id || 'unknown',
          userName: get().currentUser?.name || 'Unknown',
          timestamp: Date.now(),
        },
      };
    });

    set({ pages: { ...pages, [projectId]: updatedPages } });
  },

  setActiveBlockId: (id) => set({ activeBlockId: id }),
});
