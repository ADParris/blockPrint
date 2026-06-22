import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware'; // Added createJSONStorage
import { idbStorage } from '../api/idbStorage';

export type BlockType = 'h1' | 'h2' | 'h3' | 'p' | 'code' | 'image';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  metadata?: {
    language?: string;
    complete?: boolean;
  };
}

export interface Notebook {
  id: string;
  name: string;
  headerTitle?: string;
  coverImage?: string;
  blocks: Block[];
}

export interface CanvasState {
  notebooks: Notebook[];
  activeNotebookId: string;
  activeBlockId: string;
  // Navigation & Management
  setActiveNotebookId: (id: string) => void;
  createNotebook: () => string; // Returns the new notebook's ID
  deleteNotebook: (id: string) => void;
  getActiveNotebook: () => Notebook;
  getNotebookTitles: () => { id: string; title: string }[]; // Get notebook titles for sidebar
  updateNotebookHeader: (
    id: string,
    updates: Partial<Pick<Notebook, 'headerTitle' | 'coverImage'>>,
  ) => void; // Update header title or cover image
  moveNotebookToIndex: (activeId: string, targetIndex: number) => void;
  // Block Actions (now scoped to the active notebook)
  updateBlockContent: (id: string, newContent: string) => void;
  updateBlockType: (id: string, newType: BlockType) => void;
  deleteBlock: (id: string) => void;
  setActiveBlockId: (id: string) => void;
  moveBlockToIndex: (activeId: string, targetIndex: number) => void;
  insertBlockAtIndex: (targetIndex?: number, initialContent?: string) => string;
}

const initialNotebookId = 'default-notebook';

const useCanvasStore = create<CanvasState>()(
  persist(
    (set, get) => ({
      // Initial state with one default notebook and some seed content
      notebooks: [
        {
          id: initialNotebookId,
          name: 'My First Notebook',
          headerTitle: 'Untitled Notebook',
          coverImage: '',
          blocks: [
            { id: '1', type: 'h1', content: 'My First Notebook' },
            { id: '2', type: 'p', content: 'This is a brand new workspace.' },
          ],
        },
      ],
      // Notebook actions
      createNotebook: () => {
        const newNotebookId = crypto.randomUUID();
        const newNotebook: Notebook = {
          id: newNotebookId,
          name: 'New Notebook',
          headerTitle: 'Untitled Notebook',
          coverImage: '',
          blocks: [
            {
              id: crypto.randomUUID(),
              type: 'h1',
              content: 'Untitled Notebook',
            },
            {
              id: crypto.randomUUID(),
              type: 'p',
              content: 'Start typing here...',
            },
          ],
        };

        set((state) => ({
          notebooks: [...state.notebooks, newNotebook],
          activeNotebookId: newNotebookId, // Auto-navigate to it
        }));

        return newNotebookId;
      },
      deleteNotebook: (id: string) => {
        const { notebooks, activeNotebookId } = get();

        // Don't let them delete the absolute last notebook, or keep a fallback block structure
        const filteredNotebooks = notebooks.filter((nb) => nb.id !== id);

        let nextActiveId = activeNotebookId;
        // If we deleted the currently active notebook, automatically switch to another one
        if (id === activeNotebookId && filteredNotebooks.length > 0) {
          nextActiveId = filteredNotebooks[0].id;
        }

        set({
          notebooks: filteredNotebooks,
          activeNotebookId: nextActiveId,
        });
      },
      getActiveNotebook: () => {
        const { notebooks, activeNotebookId } = get();
        return notebooks.find((nb) => nb.id === activeNotebookId)!;
      },

      getNotebookTitles: () => {
        const { notebooks } = get();
        return notebooks.map((nb) => {
          return {
            id: nb.id,
            title: nb.headerTitle
              ? nb.headerTitle
              : nb.blocks[0]
                ? nb.blocks[0].content
                : 'Untitled Notebook',
          };
        });
      },

      moveNotebookToIndex: (activeId, targetIndex) => {
        const { notebooks } = get();
        const oldIndex = notebooks.findIndex((nb) => nb.id === activeId);
        if (oldIndex === -1) return;

        const updatedNotebooks = [...notebooks];
        const [movedNotebook] = updatedNotebooks.splice(oldIndex, 1);

        // Adjust index if moving down the list
        const finalIndex =
          oldIndex < targetIndex ? targetIndex - 1 : targetIndex;
        updatedNotebooks.splice(finalIndex, 0, movedNotebook);

        set({ notebooks: updatedNotebooks });
      },
      activeNotebookId: initialNotebookId,
      activeBlockId: '',

      setActiveNotebookId: (id) =>
        set({ activeNotebookId: id, activeBlockId: '' }),

      updateNotebookHeader: (id, updates) => {
        const { notebooks } = get();
        set({
          notebooks: notebooks.map((nb) =>
            nb.id === id ? { ...nb, ...updates } : nb,
          ),
        });
      },

      // Block actions
      insertBlockAtIndex: (targetIndex, initialContent = '') => {
        const newId = crypto.randomUUID();

        // 💡 Seed the content dynamically using the provided string parameter
        const newBlock: Block = {
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
    }),
    {
      name: 'notebook-storage',
      storage: createJSONStorage(() => idbStorage),
    },
  ),
);

export default useCanvasStore;
