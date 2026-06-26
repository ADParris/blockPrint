import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { idbStorage } from '../api/idbStorage';
import { createCanvasSlice } from './canvasSlice';
import { createDocumentSlice } from './documentSlice';
import { createImageSlice } from './imageSlice';
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
      ...createImageSlice(set, get),
    }),
    {
      name: 'notebook-storage',
      storage: createJSONStorage(() => idbStorage),
      // 🎯 Filter out the image cache from being written to persistent storage
      partialize: (state) => {
        const stateCopy = { ...state };

        // Use standard Record utility typing to safely delete the property
        // without triggering an "unused variable" warning or an "any" error
        delete (stateCopy as Record<string, unknown>).imageCache;

        return stateCopy as Omit<CanvasState, 'imageCache'>;
      },
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
