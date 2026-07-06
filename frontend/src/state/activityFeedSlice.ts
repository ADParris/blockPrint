import {
  type ActivityFeedItem,
  type ActivityFeedItemsType,
  type StoreSlice,
} from './types';

export interface ActivityFeedActions {
  addActivityFeedItem: (
    projectId: string | undefined,
    content: string,
    type: ActivityFeedItemsType,
    context?: { pageId?: string; pageTitle?: string; blockId?: string },
  ) => void;
}

export const createActivityFeedSlice: StoreSlice<ActivityFeedActions> = (
  set,
  get,
) => ({
  addActivityFeedItem: (projectId, content, type, context) => {
    if (!projectId) return;

    const state = get();
    const currentUser = state.currentUser;
    if (!currentUser) return;

    // Auto-resolve page title if needed
    let resolvedPageTitle = context?.pageTitle;
    if (context?.pageId && !resolvedPageTitle) {
      const projectPages = state.pages[projectId] || [];
      const targetPage = projectPages.find((p) => p.id === context.pageId);
      if (targetPage) {
        resolvedPageTitle = targetPage.title;
      }
    }

    const existingFeed = state.activityFeedItems[projectId] || [];

    // 🎯 THE FIX: Check if an entry already exists for this exact block
    const existingItemIndex = context?.blockId
      ? existingFeed.findIndex((item) => item.targetBlockId === context.blockId)
      : -1;

    const updatedFeed = [...existingFeed];

    if (existingItemIndex !== -1) {
      // 🔄 REPLACEMENT MUTATION: Update the existing item inline!
      updatedFeed[existingItemIndex] = {
        ...updatedFeed[existingItemIndex],
        content,
        type, // Changes 'NOTE' to 'STUB' seamlessly
        timestamp: Date.now(), // Refresh timestamp so it jumps back to the top of the timeline
      };
      console.log(
        `Updated existing timeline item context for block: ${context?.blockId}`,
      );
    } else {
      // 🆕 FRESH INSERTION: Create a brand new item if it doesn't exist
      const newItem: ActivityFeedItem = {
        id: `feed_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
        projectId,
        userId: currentUser.id,
        userName: currentUser.name,
        content,
        timestamp: Date.now(),
        type,
        likes: [],
        targetPageId: context?.pageId,
        targetPageTitle: resolvedPageTitle,
        targetBlockId: context?.blockId,
      };
      updatedFeed.push(newItem);
    }

    set({
      activityFeedItems: {
        ...state.activityFeedItems,
        [projectId]: updatedFeed,
      },
    });
  },
});
