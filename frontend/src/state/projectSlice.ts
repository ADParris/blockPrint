// src/state/projectSlice.ts
import type {
  BaseActionType,
  BaseElementType,
  FeedPost,
  HistoryEntry,
  Page,
  ProgressState,
  Project,
  StoreSlice,
} from './types';

import { BaseAction, BaseElement } from './types';

export interface ProjectActions {
  addProject: (
    name: string,
    description?: string,
    groupId?: string | null,
  ) => string; // 💡 Returning new ID so callers can navigate to it natively
  addPage: (projectId: string | undefined, title: string) => string; // 💡 Returning new ID for immediate routing
  updatePageStatus: (
    projectId: string | undefined,
    pageId: string | undefined,
    nextStatus: ProgressState,
  ) => void;
  updatePageHeader: (
    projectId: string | undefined,
    pageId: string | undefined,
    updates: Partial<Page>,
  ) => void;
  addHistoryEntry: (
    projectId: string | undefined,
    targetType: BaseElementType,
    targetName: string,
    actionType: BaseActionType,
    details?: string,
  ) => void;
  addFeedPost: (projectId: string | undefined, content: string) => void;
  reorderSidebarItems: (
    projectId: string | undefined | null, // null for top-level global project folders
    activeIndex: string | number,
    overIndex: string | number,
    type: Omit<BaseElementType, 'Block'>,
  ) => void;
  deleteProject: (projectId: string | undefined) => void;
  deletePage: (
    projectId: string | undefined,
    pageId: string | undefined,
  ) => void;
}

export const createProjectSlice: StoreSlice<ProjectActions> = (set, get) => ({
  addProject: (name, description, groupId = null) => {
    const user = get().currentUser;
    const groups = get().groups;
    const newProjectId = `proj_${Date.now()}`;

    const teamMembers =
      groupId && groups[groupId] ? groups[groupId].memberIds : [user?.id || ''];

    const newProject: Project = {
      id: newProjectId,
      name,
      description,
      headerTitle: undefined,
      coverImage: undefined,
      createdAt: Date.now(),
      status: 'On Track',
      teamMembers,
      groupId,
      isPublicShareable: false,
    };

    set((state) => ({
      projects: [...state.projects, newProject],
      pages: { ...state.pages, [newProject.id]: [] },
      changeLog: { ...state.changeLog, [newProject.id]: [] },
      feedPosts: { ...state.feedPosts, [newProject.id]: [] },
    }));

    get().addHistoryEntry(
      newProjectId,
      BaseElement.Project,
      name,
      BaseAction.Create,
      newProject.groupId
        ? `Project provisioned inside shared team workspace.`
        : `Initial layout workspace provisioned.`,
    );

    return newProjectId;
  },

  addPage: (projectId, title) => {
    // 🎯 Guard: If the router hasn't supplied a projectId yet, exit gracefully
    if (!projectId) {
      console.warn('Cannot add page: No active projectId provided.');
      return '';
    }

    const user = get().currentUser;
    const newPageId = `page_${Date.now()}`;
    const newPage: Page = {
      id: newPageId,
      projectId,
      title,
      status: 'Pending',
      lastEditedBy: {
        userId: user?.id || 'unknown',
        userName: user?.name || 'Unknown',
        timestamp: Date.now(),
      },
      blocks: [],
    };

    const newLog = {
      id: `log_${Date.now()}`,
      timestamp: Date.now(),
      userId: user?.id || 'unknown',
      userName: user?.name || 'Unknown',
      actionType: BaseAction.Create,
      targetType: BaseElement.Page,
      targetName: title,
      details: 'Created new page workspace',
    };

    set((state) => ({
      pages: {
        ...state.pages,
        [projectId]: [...(state.pages[projectId] || []), newPage],
      },
      changeLog: {
        ...state.changeLog,
        [projectId]: [newLog, ...(state.changeLog[projectId] || [])],
      },
    }));

    return newPageId;
  },

  updatePageStatus: (projectId, pageId, nextStatus) => {
    if (!projectId || !pageId) return;

    const user = get().currentUser;
    const projectPages = get().pages[projectId] || [];
    const targetPage = projectPages.find((p) => p.id === pageId);
    if (!targetPage) return;

    const prevStatus = targetPage.status;
    const updatedPages = projectPages.map((page) =>
      page.id === pageId
        ? {
            ...page,
            status: nextStatus,
            lastEditedBy: {
              userId: user?.id || '',
              userName: user?.name || '',
              timestamp: Date.now(),
            },
          }
        : page,
    );

    const newLog = {
      id: `log_${Date.now()}`,
      timestamp: Date.now(),
      userId: user?.id || '',
      userName: user?.name || '',
      actionType: BaseAction.Move,
      targetType: BaseElement.Page,
      targetName: targetPage.title,
      details: `Moved from ${prevStatus} to ${nextStatus}`,
    };

    set((state) => ({
      pages: { ...state.pages, [projectId]: updatedPages },
      changeLog: {
        ...state.changeLog,
        [projectId]: [newLog, ...(state.changeLog[projectId] || [])],
      },
    }));
  },

  updatePageHeader: (projectId, pageId, updates) => {
    if (!projectId || !pageId) return;

    const { pages } = get();
    if (!pages[projectId]) return;

    const updatedPages = pages[projectId].map((page) => {
      if (page.id !== pageId) return page;

      return {
        ...page,
        ...updates,
        lastEditedBy: {
          userId: get().currentUser?.id || 'unknown',
          userName: get().currentUser?.name || 'Unknown',
          timestamp: Date.now(),
        },
      };
    });

    set({ pages: { ...pages, [projectId]: updatedPages } });
  },

  addHistoryEntry: (projectId, targetType, targetName, actionType, details) => {
    if (!projectId) return;

    const { changeLog, currentUser } = get();
    const newEntry: HistoryEntry = {
      id: `log_${Date.now()}`,
      timestamp: Date.now(),
      userId: currentUser?.id || 'unknown',
      userName: currentUser?.name || 'Unknown Developer',
      actionType,
      targetType,
      targetName,
      details,
    };

    const projectHistory = changeLog[projectId] || [];

    set({
      changeLog: {
        ...changeLog,
        [projectId]: [newEntry, ...projectHistory],
      },
    });
  },

  addFeedPost: (projectId, content) => {
    if (!projectId) return;
    const { feedPosts, currentUser } = get();
    const newPost: FeedPost = {
      id: `post_${Date.now()}`,
      projectId,
      userId: currentUser?.id || 'unknown',
      userName: currentUser?.name || 'Alex Developer',
      content,
      timestamp: Date.now(),
      likes: [],
    };

    const projectPosts = feedPosts[projectId] || [];

    set({
      feedPosts: {
        ...feedPosts,
        [projectId]: [newPost, ...projectPosts],
      },
    });
  },

  reorderSidebarItems: (projectId, activeIndex, overIndex, type) => {
    const { currentUser, userSortOrders, projects, pages } = get();
    const userId = currentUser?.id || 'default_user';

    const userRoot = userSortOrders[userId] || {
      globalProjectsOrder: projects.map((p) => p.id),
      projectPagesOrder: {},
    };

    if (type === BaseElement.Project) {
      const baselineOrder = projects.map((p) => p.id);
      const existingOrder = userSortOrders[userId]?.globalProjectsOrder;
      const currentOrder = existingOrder?.length
        ? [...existingOrder]
        : [...baselineOrder];

      baselineOrder.forEach((id) => {
        if (!currentOrder.includes(id)) currentOrder.push(id);
      });

      const activeId = String(activeIndex);
      const overId = String(overIndex);
      const updatedOrder = currentOrder.filter((id) => id !== activeId);

      if (overId === 'APPEND_PERSONAL') {
        const personalIds = projects
          .filter((p) => p.groupId === null)
          .map((p) => p.id);
        const lastPersonalIdx = updatedOrder.findLastIndex((id) =>
          personalIds.includes(id),
        );
        updatedOrder.splice(lastPersonalIdx + 1, 0, activeId);
      } else if (overId === 'APPEND_GROUP') {
        updatedOrder.push(activeId);
      } else {
        const targetIndex = updatedOrder.indexOf(overId);
        if (targetIndex !== -1) {
          updatedOrder.splice(targetIndex, 0, activeId);
        } else {
          updatedOrder.push(activeId);
        }
      }

      set({
        userSortOrders: {
          ...userSortOrders,
          [userId]: {
            ...(userSortOrders[userId] || { projectPagesOrder: {} }),
            globalProjectsOrder: updatedOrder,
          },
        },
      });
      return;
    }

    if (!projectId) return;
    const fallbackPages = (pages[projectId] || []).map((p) => p.id);
    const currentPagesOrder = [
      ...(userRoot.projectPagesOrder[projectId] || fallbackPages),
    ];

    const numActive = Number(activeIndex);
    const numOver = Number(overIndex);

    if (
      numActive >= 0 &&
      numActive < currentPagesOrder.length &&
      numOver >= 0 &&
      numOver < currentPagesOrder.length
    ) {
      const [removed] = currentPagesOrder.splice(numActive, 1);
      currentPagesOrder.splice(numOver, 0, removed);

      set({
        userSortOrders: {
          ...userSortOrders,
          [userId]: {
            ...userRoot,
            projectPagesOrder: {
              ...userRoot.projectPagesOrder,
              [projectId]: currentPagesOrder,
            },
          },
        },
      });
    }
  },

  deleteProject: (projectId) => {
    if (!projectId) return;

    const { projects, pages, changeLog, feedPosts } = get();

    const nextPages = { ...pages };
    delete nextPages[projectId];

    const nextLogs = { ...changeLog };
    delete nextLogs[projectId];

    const nextFeeds = { ...feedPosts };
    delete nextFeeds[projectId];

    const nextProjects = projects.filter((p) => p.id !== projectId);

    set({
      projects: nextProjects,
      pages: nextPages,
      changeLog: nextLogs,
      feedPosts: nextFeeds,
    });
  },

  deletePage: (projectId, pageId) => {
    if (!projectId || !pageId) return;

    const { pages } = get();
    const currentProjectPages = pages[projectId] || [];
    const nextProjectPages = currentProjectPages.filter((p) => p.id !== pageId);

    set({
      pages: {
        ...pages,
        [projectId]: nextProjectPages,
      },
    });
  },
});
