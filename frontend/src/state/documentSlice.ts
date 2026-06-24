import type { BlockType, CanvasBlock, StoreSlice } from './types';

export interface DocumentActions {
  insertBlockAtIndex: (targetIndex?: number, initialContent?: string) => string;
  updateBlockContent: (id: string, newContent: string) => void;
  updateBlockType: (id: string, newType: BlockType) => void;
  deleteBlock: (id: string) => void;
  setActiveBlockId: (id: string) => void;
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
    const { activeNotebookId, notebooks } = get();

    set({
      notebooks: notebooks.map((nb) => {
        if (nb.id !== activeNotebookId) return nb;
        const updatedBlocks = [...nb.blocks];
        const actualIndex = targetIndex ?? updatedBlocks.length;
        updatedBlocks.splice(actualIndex, 0, newBlock);
        return { ...nb, blocks: updatedBlocks };
      }),
    });
    return newId;
  },

  updateBlockContent: (id, newContent) => {
    const { activeNotebookId, notebooks } = get();
    set({
      notebooks: notebooks.map((nb) => {
        if (nb.id !== activeNotebookId) return nb;
        return {
          ...nb,
          blocks: nb.blocks.map((b) =>
            b.id === id ? { ...b, content: newContent } : b,
          ),
        };
      }),
    });
  },

  updateBlockType: (id, newType) => {
    const { activeNotebookId, notebooks } = get();
    set({
      notebooks: notebooks.map((nb) => {
        if (nb.id !== activeNotebookId) return nb;
        return {
          ...nb,
          blocks: nb.blocks.map((b) =>
            b.id === id ? { ...b, type: newType } : b,
          ),
        };
      }),
    });
  },

  deleteBlock: (id) => {
    const { activeNotebookId, notebooks } = get();
    set({
      notebooks: notebooks.map((nb) => {
        if (nb.id !== activeNotebookId) return nb;
        return { ...nb, blocks: nb.blocks.filter((b) => b.id !== id) };
      }),
    });
  },

  moveBlockToIndex: (activeId, targetIndex) => {
    const { activeNotebookId, notebooks } = get();
    set({
      notebooks: notebooks.map((nb) => {
        if (nb.id !== activeNotebookId) return nb;
        const oldIndex = nb.blocks.findIndex((b) => b.id === activeId);
        if (oldIndex === -1) return nb;

        const updatedBlocks = [...nb.blocks];
        const [movedBlock] = updatedBlocks.splice(oldIndex, 1);
        const finalIndex =
          oldIndex < targetIndex ? targetIndex - 1 : targetIndex;
        updatedBlocks.splice(finalIndex, 0, movedBlock);

        return { ...nb, blocks: updatedBlocks };
      }),
    });
  },

  setActiveBlockId: (id) => set({ activeBlockId: id }),
});
