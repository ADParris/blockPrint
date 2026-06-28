// src/state/documentSlice.ts
import type { BlockType, CanvasBlock, StoreSlice } from './types';

export interface DocumentActions {
  insertBlockAtIndex: (targetIndex?: number, initialContent?: string) => string;
  updateBlockContent: (id: string, newContent: string) => void;
  updateBlockType: (id: string, newType: BlockType) => void;
  deleteBlock: (id: string) => void;
  setActiveBlockId: (id: string | null) => void;
  moveBlockToIndex: (activeId: string, targetIndex: number) => void;
}

export const createDocumentSlice: StoreSlice<DocumentActions> = (set, get) => ({
  insertBlockAtIndex: (targetIndex, initialContent = '') => {
    const newId = crypto.randomUUID();
    const newBlock: CanvasBlock = {
      id: newId,
      type: 'p',
      content: initialContent,
    };
    const { activeProjectId, activePageId, pages } = get();
    if (!activeProjectId || !activePageId || !pages[activeProjectId]) return '';

    const updatedPages = pages[activeProjectId].map((page) => {
      if (page.id !== activePageId) return page;

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

    set({ pages: { ...pages, [activeProjectId]: updatedPages } });
    return newId;
  },

  updateBlockContent: (id, newContent) => {
    const { activeProjectId, activePageId, pages } = get();
    if (!activeProjectId || !activePageId || !pages[activeProjectId]) return;

    const updatedPages = pages[activeProjectId].map((page) => {
      if (page.id !== activePageId) return page;
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

    set({ pages: { ...pages, [activeProjectId]: updatedPages } });
  },

  updateBlockType: (id, newType) => {
    const { activeProjectId, activePageId, pages } = get();
    if (!activeProjectId || !activePageId || !pages[activeProjectId]) return;

    const updatedPages = pages[activeProjectId].map((page) => {
      if (page.id !== activePageId) return page;
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

    set({ pages: { ...pages, [activeProjectId]: updatedPages } });
  },

  deleteBlock: (id) => {
    const { activeProjectId, activePageId, pages, activeBlockId } = get();
    if (!activeProjectId || !activePageId || !pages[activeProjectId]) return;

    const updatedPages = pages[activeProjectId].map((page) => {
      if (page.id !== activePageId) return page;
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
      pages: { ...pages, [activeProjectId]: updatedPages },
      activeBlockId: activeBlockId === id ? null : activeBlockId,
    });
  },

  moveBlockToIndex: (activeId, targetIndex) => {
    const { activeProjectId, activePageId, pages } = get();
    if (!activeProjectId || !activePageId || !pages[activeProjectId]) return;

    const updatedPages = pages[activeProjectId].map((page) => {
      if (page.id !== activePageId) return page;

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

    set({ pages: { ...pages, [activeProjectId]: updatedPages } });
  },

  setActiveBlockId: (id) => set({ activeBlockId: id }),
});
