// src/state/kanbanSlice.ts
import { reorderKanbanItems } from '../utils/kanban';
import type { CanvasBlock, Page, ProgressState, StoreSlice } from './types';

export interface KanbanActions {
  // Project Level (Pages)
  getProjectPages: (
    projectId: string | undefined,
    columnId: ProgressState,
  ) => Page[];
  movePageInKanban: (
    projectId: string | undefined,
    pageId: string | undefined,
    targetColumnId: ProgressState,
    targetIndex: number,
  ) => void;

  // Page Level (Blocks)
  getPageBlocks: (
    projectId: string | undefined,
    pageId: string | undefined,
    columnId: ProgressState,
  ) => CanvasBlock[];
  moveBlockInKanban: (
    projectId: string | undefined,
    pageId: string | undefined,
    blockId: string,
    targetColumnId: ProgressState,
    targetIndex: number,
  ) => void;
}

export const createKanbanSlice: StoreSlice<KanbanActions> = (set, get) => ({
  // --- PROJECT LEVEL QUANTUM ---
  getProjectPages: (projectId, columnId) => {
    const { pages } = get();
    if (!projectId) return [];

    return (pages[projectId] || [])
      .filter((page) => (page.kanban?.columnId || 'Pending') === columnId)
      .sort(
        (a, b) => (a.kanban?.orderIndex || 0) - (b.kanban?.orderIndex || 0),
      );
  },

  movePageInKanban: (projectId, pageId, targetColumnId, targetIndex) => {
    const { pages, currentUser } = get();
    if (!projectId || !pageId) return;

    const projectPages = pages[projectId] || [];
    const targetPage = projectPages.find((p) => p.id === pageId);
    if (!targetPage) return;

    const oldColumnId = targetPage.kanban?.columnId || 'Pending';
    const pageTitle = targetPage.title || 'Untitled Page';

    set((state) => {
      const currentList = state.pages[projectId] || [];

      const finalPagesList = reorderKanbanItems({
        items: currentList,
        itemId: pageId,
        targetColumnId,
        targetIndex,
      });

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

      return {
        pages: { ...state.pages, [projectId]: finalPagesList },
        changeLog: {
          ...state.changeLog,
          [projectId]: [historyEntry, ...(state.changeLog[projectId] || [])],
        },
      };
    });
  },

  // --- PAGE LEVEL QUANTUM (New) ---
  getPageBlocks: (projectId, pageId, columnId) => {
    const { pages } = get();
    if (!projectId || !pageId) return [];

    const currentPage = (pages[projectId] || []).find((p) => p.id === pageId);
    if (!currentPage) return [];

    return (currentPage.blocks || [])
      .filter((block) => (block.kanban?.columnId || 'Pending') === columnId)
      .sort(
        (a, b) => (a.kanban?.orderIndex || 0) - (b.kanban?.orderIndex || 0),
      );
  },

  moveBlockInKanban: (
    projectId,
    pageId,
    blockId,
    targetColumnId,
    targetIndex,
  ) => {
    const { pages, currentUser } = get();
    if (!projectId || !pageId) return;

    const projectPages = pages[projectId] || [];
    const currentPage = projectPages.find((p) => p.id === pageId);
    if (!currentPage) return;

    const targetBlock = currentPage.blocks.find((b) => b.id === blockId);
    if (!targetBlock) return;

    const oldColumnId = targetBlock.kanban?.columnId || 'Pending';

    set((state) => {
      const currentPagesList = state.pages[projectId] || [];
      const pageToModify = currentPagesList.find((p) => p.id === pageId);
      if (!pageToModify) return {};

      const finalBlocksList = reorderKanbanItems({
        items: pageToModify.blocks,
        itemId: blockId,
        targetColumnId,
        targetIndex,
      });

      const updatedPagesList = currentPagesList.map((p) =>
        p.id === pageId ? { ...p, blocks: finalBlocksList } : p,
      );

      const historyEntry = {
        id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        userId: currentUser?.id || 'u1',
        userName: currentUser?.name || 'ADParris',
        actionType: 'UPDATE' as const,
        targetType: 'BLOCK' as const,
        targetName: targetBlock.content.substring(0, 20) || 'Canvas Block',
        details:
          oldColumnId === targetColumnId
            ? `Reordered element inside "${targetColumnId}"`
            : `Moved element from "${oldColumnId}" to "${targetColumnId}"`,
      };

      return {
        pages: { ...state.pages, [projectId]: updatedPagesList },
        changeLog: {
          ...state.changeLog,
          [projectId]: [historyEntry, ...(state.changeLog[projectId] || [])],
        },
      };
    });
  },
});
