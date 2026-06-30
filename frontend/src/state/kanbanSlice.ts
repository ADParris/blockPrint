import { reorderKanbanItems } from '../utils/kanban';
import type { CanvasBlock, Page, ProgressState, StoreSlice } from './types';

export interface KanbanActions {
  // Project Level (Pages)
  getProjectPages: (columnId: ProgressState) => Page[];
  movePageInKanban: (
    pageId: string,
    targetColumnId: ProgressState,
    targetIndex: number,
  ) => void;

  // Page Level (Blocks)
  getPageBlocks: (columnId: ProgressState) => CanvasBlock[];
  moveBlockInKanban: (
    blockId: string,
    targetColumnId: ProgressState,
    targetIndex: number,
  ) => void;
}

export const createKanbanSlice: StoreSlice<KanbanActions> = (set, get) => ({
  // --- PROJECT LEVEL QUANTUM ---
  getProjectPages: (columnId) => {
    const { activeProjectId, pages } = get();
    if (!activeProjectId) return [];

    return (pages[activeProjectId] || [])
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

      // 🎯 Direct utility execution
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
        pages: { ...state.pages, [activeProjectId]: finalPagesList },
        changeLog: {
          ...state.changeLog,
          [activeProjectId]: [
            historyEntry,
            ...(state.changeLog[activeProjectId] || []),
          ],
        },
      };
    });
  },

  // --- PAGE LEVEL QUANTUM (New) ---
  getPageBlocks: (columnId) => {
    const { activeProjectId, activePageId, pages } = get();
    if (!activeProjectId || !activePageId) return [];

    const currentPage = (pages[activeProjectId] || []).find(
      (p) => p.id === activePageId,
    );
    if (!currentPage) return [];

    return (currentPage.blocks || [])
      .filter((block) => (block.kanban?.columnId || 'Pending') === columnId)
      .sort(
        (a, b) => (a.kanban?.orderIndex || 0) - (b.kanban?.orderIndex || 0),
      );
  },

  moveBlockInKanban: (blockId, targetColumnId, targetIndex) => {
    const { activeProjectId, activePageId, pages, currentUser } = get();
    if (!activeProjectId || !activePageId) return;

    const projectPages = pages[activeProjectId] || [];
    const currentPage = projectPages.find((p) => p.id === activePageId);
    if (!currentPage) return;

    const targetBlock = currentPage.blocks.find((b) => b.id === blockId);
    if (!targetBlock) return;

    const oldColumnId = targetBlock.kanban?.columnId || 'Pending';

    set((state) => {
      const currentPagesList = state.pages[activeProjectId] || [];
      const pageToModify = currentPagesList.find((p) => p.id === activePageId);
      if (!pageToModify) return {};

      // 🎯 Run the exact same utility for blocks!
      const finalBlocksList = reorderKanbanItems({
        items: pageToModify.blocks,
        itemId: blockId,
        targetColumnId,
        targetIndex,
      });

      const updatedPagesList = currentPagesList.map((p) =>
        p.id === activePageId ? { ...p, blocks: finalBlocksList } : p,
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
        pages: { ...state.pages, [activeProjectId]: updatedPagesList },
        changeLog: {
          ...state.changeLog,
          [activeProjectId]: [
            historyEntry,
            ...(state.changeLog[activeProjectId] || []),
          ],
        },
      };
    });
  },
});
