import type { Page, ProgressState, StoreSlice } from './types';

export interface KanbanActions {
  getProjectPages: (columnId: ProgressState) => Page[];
  movePageInKanban: (
    pageId: string,
    targetColumnId: ProgressState,
    targetIndex: number,
  ) => void;
}

export const createKanbanSlice: StoreSlice<KanbanActions> = (set, get) => ({
  // 🎯 Direct, reusable store filter query
  getProjectPages: (columnId) => {
    const { activeProjectId, pages } = get();
    if (!activeProjectId) return [];

    const projectPages = pages[activeProjectId] || [];
    return projectPages
      .filter((page) => (page.kanban?.columnId || 'Pending') === columnId)
      .sort(
        (a, b) => (a.kanban?.orderIndex || 0) - (b.kanban?.orderIndex || 0),
      );
  },

  movePageInKanban: (pageId, targetColumnId, targetIndex) => {
    const { activeProjectId, pages, currentUser } = get();
    if (!activeProjectId) return;

    const projectPages = pages[activeProjectId] || [];
    const targetPage = projectPages.find((p) => p.id === pageId);
    if (!targetPage) return;

    const oldColumnId = targetPage.kanban?.columnId || 'Pending';
    const pageTitle = targetPage.title || 'Untitled Page';

    set((state) => {
      const currentList = state.pages[activeProjectId] || [];

      // 1. Separate the target lane layout from the other pages
      const unaffectedPages = currentList.filter(
        (p) =>
          (p.kanban?.columnId || 'Pending') !== targetColumnId &&
          p.id !== pageId,
      );

      const targetColumnPages = currentList
        .filter(
          (p) =>
            (p.kanban?.columnId || 'Pending') === targetColumnId &&
            p.id !== pageId,
        )
        .sort(
          (a, b) => (a.kanban?.orderIndex || 0) - (b.kanban?.orderIndex || 0),
        );

      // 2. Prepare the modified page package with its new column definitions
      const updatedPage = {
        ...targetPage,
        kanban: {
          columnId: targetColumnId,
          orderIndex: targetIndex,
        },
      };

      // 3. Inject it straight into the lane sequence array position cleanly
      targetColumnPages.splice(targetIndex, 0, updatedPage);

      // 4. Re-index sequence indexes across the altered lane to guarantee index integrity
      const indexedTargetPages = targetColumnPages.map((p, index) => ({
        ...p,
        kanban: {
          ...(p.kanban || { columnId: targetColumnId }),
          orderIndex: index,
        },
      }));

      // 5. Clean up indices on the source column lane if the page jumped columns completely
      let finalPagesList = [...unaffectedPages, ...indexedTargetPages];
      if (oldColumnId !== targetColumnId) {
        const sourceColumnPages = finalPagesList
          .filter((p) => (p.kanban?.columnId || 'Pending') === oldColumnId)
          .sort(
            (a, b) => (a.kanban?.orderIndex || 0) - (b.kanban?.orderIndex || 0),
          )
          .map((p, index) => ({
            ...p,
            kanban: {
              ...(p.kanban || { columnId: oldColumnId }),
              orderIndex: index,
            },
          }));

        const restOfPages = finalPagesList.filter(
          (p) => (p.kanban?.columnId || 'Pending') !== oldColumnId,
        );
        finalPagesList = [...restOfPages, ...sourceColumnPages];
      }

      // 6. Generate logging entry to feed metrics back to the Dashboard
      const historyEntry = {
        id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        userId: currentUser?.id || 'u1',
        userName: currentUser?.name || 'ADParris',
        actionType: 'UPDATE' as const,
        targetType: 'PAGE' as const,
        targetName: pageTitle.substring(0, 20),
        details:
          oldColumnId === targetColumnId
            ? `Reordered page layout inside "${targetColumnId}"`
            : `Moved page from "${oldColumnId}" to "${targetColumnId}"`,
      };

      const projectLogs = state.changeLog[activeProjectId] || [];

      return {
        pages: {
          ...state.pages,
          [activeProjectId]: finalPagesList,
        },
        changeLog: {
          ...state.changeLog,
          [activeProjectId]: [historyEntry, ...projectLogs],
        },
      };
    });
  },
});
