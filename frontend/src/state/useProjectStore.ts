import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { idbStorage } from '../api/idbStorage';
import { projectApi } from '../api/projects';
import { createCanvasSlice } from './canvasSlice';
import { createDocumentSlice } from './documentSlice';
import { createImageSlice } from './imageSlice';
import { createProjectSlice } from './projectSlice';
import { createKanbanSlice } from './kanbanSlice';
import type { ProjectState } from './types';
import { WorkspaceViewMode } from './types';

// 🎯 FIX 1: Explicitly match the backup file database partition key
const mockUserId = 'u1';

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      // --- Identity Archetypes ---
      currentUser: { id: mockUserId, name: 'ADParris' },
      users: {
        [mockUserId]: { id: mockUserId, name: 'ADParris' },
        u2: { id: 'u2', name: 'Sarah_Dev' },
        u3: { id: 'u3', name: 'Alex_PM' },
      },
      groups: {
        group_design_team: {
          id: 'group_design_team',
          name: 'Design Team',
          slug: 'design-team', // 💡 This will drive the URL: /design-team/projects/...
          memberIds: [mockUserId, 'u2', 'u3'],
        },
      },

      // --- Project Collections & Dictionaries ---
      projects: [],
      pages: {},
      changeLog: {},
      feedPosts: {},
      userSortOrders: {},

      // --- UI States ---
      activeProjectId: null,
      activePageId: null,
      activeBlockId: '',
      activeViewMode: WorkspaceViewMode.ProjectDashboard,
      isLoading: true, // Remains true until local hydration finishes
      imageCache: {},

      ...createProjectSlice(set, get),
      ...createCanvasSlice(set, get),
      ...createDocumentSlice(set, get),
      ...createImageSlice(set, get),
      ...createKanbanSlice(set, get),

      setWorkspaceViewMode: (mode) => {
        set({ activeViewMode: mode });
      },

      // 🎯 PIPELINE BACKEND RESTORATION (Only runs if IndexedDB is blank)
      loadFromBackend: async () => {
        set({ isLoading: true });
        try {
          console.log(`Checking file system backup for user: ${mockUserId}...`);
          const allUserData = await projectApi.loadWorkspace();
          const myData = allUserData[mockUserId];

          if (myData) {
            set({
              projects: myData.projects || [],
              pages: myData.pages || {},
              userSortOrders: myData.userSortOrders || {},
            });
            console.log(
              'Successfully re-seeded memory and IndexedDB from backup file.',
            );
          }
        } catch (error) {
          console.error(
            'Failed to restore workspace from backend file:',
            error,
          );
        } finally {
          set({ isLoading: false });
        }
      },

      // 🎯 PIPELINE downstream synchronization
      syncToBackend: async () => {
        try {
          const currentState = get();
          const latestDiskData = (await projectApi.loadWorkspace()) || {};

          const updatedPayload = {
            ...latestDiskData,
            [mockUserId]: {
              projects: currentState.projects,
              pages: currentState.pages,
              userSortOrders: currentState.userSortOrders,
            },
          };

          await projectApi.saveWorkspace(updatedPayload);
          console.log('✔ Downstream backend file sync complete.');
        } catch (error) {
          console.error('Workspace backup synchronization failed:', error);
        }
      },
    }),
    {
      name: 'project-workspace-storage',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        users: state.users,
        groups: state.groups,
        projects: state.projects,
        pages: state.pages,
        changeLog: state.changeLog,
        feedPosts: state.feedPosts,
        userSortOrders: state.userSortOrders,
        activeProjectId: state.activeProjectId,
        activePageId: state.activePageId,
        activeViewMode: state.activeViewMode,
        cameraOffset: state.cameraOffset,
        zoomScale: state.zoomScale,
      }),
      // 🎯 FIXED OFFLINE-FIRST LIFECYCLE CONTROLLER
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('An error occurred during hydration:', error);
          } else if (state) {
            // Phase 1: Local IndexedDB rehydration into memory is 100% finished.

            // 🎯 FIX: Check if currentUser exists. If it does, IndexedDB has been seeded before.
            // An empty projects array means the user intentionally deleted their projects!
            const isDbEmptyAndUninitialized =
              (!state.projects || state.projects.length === 0) &&
              !state.currentUser?.id;

            if (isDbEmptyAndUninitialized) {
              console.log(
                'IndexedDB is genuinely uninitialized. Fetching backend backup stream...',
              );
              state.loadFromBackend();
            } else {
              console.log(
                'Offline state restored cleanly from IndexedDB (Even if empty).',
              );

              // Turn off the loading screen cleanly
              useProjectStore.setState({ isLoading: false });
            }
          }
        };
      },
    },
  ),
);

// 📡 Server-Side Synchronization Monitor (Downstream Pipeline Output)
let syncTimeout: ReturnType<typeof setTimeout> | undefined;
let lastSavedPagesJson = '';

useProjectStore.subscribe((state) => {
  // If we are actively booting or have no data layers, don't write empty states out to disk
  if (state.isLoading) return;

  const targetStateToSync = {
    projects: state.projects,
    pages: state.pages,
    groups: state.groups,
    userSortOrders: state.userSortOrders,
  };
  const currentJson = JSON.stringify(targetStateToSync);

  if (!lastSavedPagesJson) {
    lastSavedPagesJson = currentJson;
    return;
  }
  if (currentJson === lastSavedPagesJson) return;

  lastSavedPagesJson = currentJson;
  clearTimeout(syncTimeout);

  // Queue background update following a change to IndexedDB/Memory
  syncTimeout = setTimeout(() => {
    useProjectStore.getState().syncToBackend();
  }, 2500);
});

// 🌐 Network Resilience: Patiently wait for connection recovery
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log(
      '🌐 Connection restored! Flushing local IndexedDB state downstream to backup file...',
    );

    // Check if we have active data before blindly forcing a write
    const state = useProjectStore.getState();
    if (!state.isLoading && state.projects.length > 0) {
      state.syncToBackend();
    }
  });
}

export { createConnectionKey } from './canvasSlice';
