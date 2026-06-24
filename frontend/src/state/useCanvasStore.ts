import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { idbStorage } from '../api/idbStorage';
import { createCanvasSlice } from './canvasSlice';
import { createDocumentSlice } from './documentSlice';
import { createNotebookSlice } from './notebookSlice';
import type { CanvasState } from './types';
import { LayoutMode } from './types';

const initialNotebookId = 'default-notebook';

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set, get) => ({
      // Baseline core variables
      notebooks: [
        {
          id: initialNotebookId,
          name: 'My First Notebook',
          headerTitle: 'Untitled Notebook',
          coverImage: '',
          layoutMode: LayoutMode.DocumentCanvas,
          blocks: [
            { id: '1', type: 'h1', content: 'My First Notebook' },
            { id: '2', type: 'p', content: 'This is a brand new workspace.' },
          ],
        },
      ],
      activeNotebookId: initialNotebookId,
      activeBlockId: '',
      isLoading: true,

      // Construct and compose state layers safely
      ...createCanvasSlice(set, get),
      ...createNotebookSlice(set, get),
      ...createDocumentSlice(set, get),
    }),
    {
      name: 'notebook-storage',
      storage: createJSONStorage(() => idbStorage),
    },
  ),
);

// 📡 Server-Side Synchronization Monitor
let syncTimeout: ReturnType<typeof setTimeout> | undefined;
let lastSavedNotebooksJson = '';

useCanvasStore.subscribe((state) => {
  const notebooks = state.notebooks;
  if (!notebooks || notebooks.length === 0) return;

  const currentJson = JSON.stringify(notebooks);
  if (!lastSavedNotebooksJson) {
    lastSavedNotebooksJson = currentJson;
    return;
  }
  if (currentJson === lastSavedNotebooksJson) return;

  lastSavedNotebooksJson = currentJson;
  clearTimeout(syncTimeout);

  syncTimeout = setTimeout(() => {
    useCanvasStore.getState().syncToBackend();
  }, 2500);
});

// Seed system state instantly on script parse execution
useCanvasStore.getState().loadFromBackend();
