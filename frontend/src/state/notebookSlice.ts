// src/state/notebookSlice.ts
import type { Notebook, StoreSlice } from './types';
import { LayoutMode } from './types';

export interface NotebookActions {
  setActiveNotebookId: (id: string) => void;
  createNotebook: () => string;
  deleteNotebook: (id: string) => void;
  getActiveNotebook: () => Notebook;
  getNotebookTitles: () => { id: string; title: string }[];
  updateNotebookHeader: (
    id: string,
    updates: Partial<
      Pick<Notebook, 'headerTitle' | 'coverImage' | 'layoutMode'>
    >,
  ) => void;
  moveNotebookToIndex: (activeId: string, targetIndex: number) => void;
  loadFromBackend: () => Promise<void>;
  syncToBackend: () => Promise<void>;
}

export const createNotebookSlice: StoreSlice<NotebookActions> = (set, get) => ({
  setActiveNotebookId: (id) =>
    set(() => ({ activeNotebookId: id, activeBlockId: '' })),

  loadFromBackend: async () => {
    try {
      const response = await fetch('http://localhost:3001/api/load');
      if (!response.ok) throw new Error('Failed to fetch backend data');

      // Type the unknown network payload as an object containing an array of partial notebooks
      const data = (await response.json()) as {
        notebooks?: Omit<Notebook, 'layoutMode'>[];
      };

      if (data.notebooks && data.notebooks.length > 0) {
        // Clean, type-safe assignment with zero 'any' overrides!
        const validatedNotebooks: Notebook[] = data.notebooks.map((nb) => ({
          ...nb,
          layoutMode: LayoutMode.DocumentCanvas, // Safely attach the new configuration property
        }));

        set(() => ({
          notebooks: validatedNotebooks,
          activeNotebookId: validatedNotebooks[0].id,
        }));
        console.log('📖 Notebooks successfully loaded from disk server!');
      }
    } catch (error) {
      console.error('❌ Failed to seed state from backend:', error);
    } finally {
      set(() => ({ isLoading: false }));
    }
  },

  syncToBackend: async () => {
    const { notebooks } = get();
    try {
      const response = await fetch('http://localhost:3001/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lastSynced: new Date().toISOString(),
          notebooks,
        }),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      console.log('📡 Background Sync:', data.message);
    } catch (error) {
      console.error('❌ Background sync failed:', error);
    }
  },

  createNotebook: () => {
    const newNotebookId = crypto.randomUUID();
    const newNotebook: Notebook = {
      id: newNotebookId,
      name: 'New Notebook',
      headerTitle: 'Untitled Notebook',
      coverImage: '',
      layoutMode: LayoutMode.DocumentCanvas,
      blocks: [
        { id: crypto.randomUUID(), type: 'h1', content: 'Untitled Notebook' },
        { id: crypto.randomUUID(), type: 'p', content: 'Start typing here...' },
      ],
    };

    set((state) => ({
      notebooks: [...state.notebooks, newNotebook],
      activeNotebookId: newNotebookId,
    }));
    return newNotebookId;
  },

  deleteNotebook: (id) => {
    const { notebooks, activeNotebookId } = get();
    const filteredNotebooks = notebooks.filter((nb) => nb.id !== id);
    let nextActiveId = activeNotebookId;

    if (id === activeNotebookId && filteredNotebooks.length > 0) {
      nextActiveId = filteredNotebooks[0].id;
    }

    set(() => ({
      notebooks: filteredNotebooks,
      activeNotebookId: nextActiveId,
    }));
  },

  getActiveNotebook: () => {
    const { notebooks, activeNotebookId } = get();
    return notebooks.find((nb) => nb.id === activeNotebookId) || notebooks[0];
  },

  getNotebookTitles: () => {
    const { notebooks } = get();
    return notebooks.map((nb) => ({
      id: nb.id,
      title:
        nb.headerTitle ||
        (nb.blocks[0] ? nb.blocks[0].content : 'Untitled Notebook'),
    }));
  },

  updateNotebookHeader: (id, updates) => {
    const { notebooks } = get();
    set(() => ({
      notebooks: notebooks.map((nb) =>
        nb.id === id ? { ...nb, ...updates } : nb,
      ),
    }));
  },

  moveNotebookToIndex: (activeId, targetIndex) => {
    const { notebooks } = get();
    const oldIndex = notebooks.findIndex((nb) => nb.id === activeId);
    if (oldIndex === -1) return;

    const updatedNotebooks = [...notebooks];
    const [movedNotebook] = updatedNotebooks.splice(oldIndex, 1);
    const finalIndex = oldIndex < targetIndex ? targetIndex - 1 : targetIndex;
    updatedNotebooks.splice(finalIndex, 0, movedNotebook);

    set(() => ({ notebooks: updatedNotebooks }));
  },
});
