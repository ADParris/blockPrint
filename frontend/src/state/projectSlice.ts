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
  WorkspaceViewModeType,
} from './types';

import {
  BaseAction,
  BaseElement,
  LayoutMode,
  WorkspaceViewMode,
} from './types';

export interface ProjectActions {
  setActiveProjectId: (id: string | null) => void;
  setActivePageId: (id: string | null) => void;
  setWorkspaceView: (
    viewMode: WorkspaceViewModeType,
    pageId?: string | null,
  ) => void; // 🎯 New Explicit Router Action
  addProject: (
    name: string,
    description?: string,
    groupId?: string | null,
  ) => void;
  addPage: (projectId: string, title: string) => void;
  updatePageStatus: (
    projectId: string,
    pageId: string,
    nextStatus: ProgressState,
  ) => void;
  updatePageHeader: (pageId: string, updates: Partial<Page>) => void;
  addHistoryEntry: (
    targetType: BaseElementType,
    targetName: string,
    actionType: BaseActionType,
    details?: string,
  ) => void;
  addFeedPost: (content: string) => void;
  reorderSidebarItems: (
    projectId: string | null, // null for top-level global project folders
    activeIndex: number,
    overIndex: number,
    type: Omit<BaseElementType, 'Block'>,
  ) => void;
  deleteProject: (projectId: string) => void;
  deletePage: (projectId: string, pageId: string) => void;
}

export const createProjectSlice: StoreSlice<ProjectActions> = (set, get) => ({
  setActiveProjectId: (id) => {
    // 🎯 Clicking a project folder now drops them straight onto its Project Dashboard Feed
    set({
      activeProjectId: id,
      activePageId: null,
      activeViewMode: WorkspaceViewMode.ProjectDashboard,
    });
  },

  setActivePageId: (id) => {
    // 🎯 Clicking a specific page defaults back to standard Document canvas rendering
    set({
      activePageId: id,
      activeViewMode: WorkspaceViewMode.PageDocument,
    });
  },

  // 🎯 Centralized view-switching router action
  setWorkspaceView: (viewMode, pageId = null) => {
    set({
      activeViewMode: viewMode,
      activePageId:
        viewMode === WorkspaceViewMode.ProjectDashboard ? null : pageId,
    });
  },

  // 🎯 FIX inside projectSlice.ts
  addProject: (
    name: string,
    description: string | undefined,
    groupId: string | null = null,
  ) => {
    const user = get().currentUser;
    const groups = get().groups;

    // 💡 Dynamically pull team members if assigned to a group, otherwise default to current user
    const teamMembers =
      groupId && groups[groupId] ? groups[groupId].memberIds : [user?.id || ''];

    const newProject: Project = {
      id: `proj_${Date.now()}`,
      name,
      description,
      headerTitle: undefined,
      coverImage: undefined,
      createdAt: Date.now(),
      status: 'On Track',
      teamMembers,
      groupId, // 🎯 FIX: Capture the passed groupId parameter perfectly!
      isPublicShareable: false,
    };

    set((state) => ({
      projects: [...state.projects, newProject],
      pages: { ...state.pages, [newProject.id]: [] },
      changeLog: { ...state.changeLog, [newProject.id]: [] },
      feedPosts: { ...state.feedPosts, [newProject.id]: [] },
      activeProjectId: newProject.id,
      activePageId: null,
      activeViewMode: WorkspaceViewMode.ProjectDashboard,
    }));

    get().addHistoryEntry(
      BaseElement.Project,
      name,
      BaseAction.Create,
      newProject.groupId
        ? `Project provisioned inside shared team workspace.`
        : `Initial layout workspace provisioned.`,
    );
  },

  addPage: (projectId, title) => {
    const user = get().currentUser;
    const newPage: Page = {
      id: `page_${Date.now()}`,
      projectId,
      title,
      status: 'Pending',
      layoutMode: LayoutMode.DocumentCanvas,
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
      activePageId: newPage.id,
      activeViewMode: WorkspaceViewMode.PageDocument, // 🎯 Route immediately to the new page canvas
    }));
  },

  updatePageStatus: (projectId, pageId, nextStatus) => {
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

  updatePageHeader: (pageId, updates) => {
    const { activeProjectId, pages } = get();
    if (!activeProjectId || !pages[activeProjectId]) return;

    const updatedPages = pages[activeProjectId].map((page) => {
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

    set({ pages: { ...pages, [activeProjectId]: updatedPages } });
  },

  addHistoryEntry: (targetType, targetName, actionType, details) => {
    const { activeProjectId, changeLog, currentUser } = get();
    if (!activeProjectId) return;

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

    const projectHistory = changeLog[activeProjectId] || [];

    set({
      changeLog: {
        ...changeLog,
        [activeProjectId]: [newEntry, ...projectHistory],
      },
    });
  },

  // 🎯 Commits a new user note/announcement into the conversational array
  addFeedPost: (content) => {
    const { activeProjectId, feedPosts, currentUser } = get();
    if (!activeProjectId) return;

    const newPost: FeedPost = {
      id: `post_${Date.now()}`,
      projectId: activeProjectId,
      userId: currentUser?.id || 'unknown',
      userName: currentUser?.name || 'Alex Developer',
      content,
      timestamp: Date.now(),
      likes: [],
    };

    const projectPosts = feedPosts[activeProjectId] || [];

    set({
      feedPosts: {
        ...feedPosts,
        [activeProjectId]: [newPost, ...projectPosts],
      },
    });
  },
  reorderSidebarItems: (projectId, activeIndex, overIndex, type) => {
    const { currentUser, userSortOrders, projects, pages } = get();
    const userId = currentUser?.id || 'default_user';

    // 1. Safely clone or initialize this specific user's root order configuration
    const userRoot = userSortOrders[userId] || {
      globalProjectsOrder: projects.map((p) => p.id),
      projectPagesOrder: {},
    };

    if (type === 'project') {
      const currentOrder = [...userRoot.globalProjectsOrder];

      // Ensure the indices are valid bounds
      if (
        activeIndex >= 0 &&
        activeIndex < currentOrder.length &&
        overIndex >= 0 &&
        overIndex < currentOrder.length
      ) {
        const [removed] = currentOrder.splice(activeIndex, 1);
        currentOrder.splice(overIndex, 0, removed);

        set({
          userSortOrders: {
            ...userSortOrders,
            [userId]: { ...userRoot, globalProjectsOrder: currentOrder },
          },
        });
      }
      return;
    }

    // 2. Handle nested sub-page sorting isolated inside a specific project folder
    if (!projectId) return;
    const fallbackPages = (pages[projectId] || []).map((p) => p.id);
    const currentPagesOrder = [
      ...(userRoot.projectPagesOrder[projectId] || fallbackPages),
    ];

    if (
      activeIndex >= 0 &&
      activeIndex < currentPagesOrder.length &&
      overIndex >= 0 &&
      overIndex < currentPagesOrder.length
    ) {
      const [removed] = currentPagesOrder.splice(activeIndex, 1);
      currentPagesOrder.splice(overIndex, 0, removed);

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
    const { projects, pages, changeLog, feedPosts, activeProjectId } = get();

    // 1. Evict structural dictionaries completely
    const nextPages = { ...pages };
    delete nextPages[projectId];

    const nextLogs = { ...changeLog };
    delete nextLogs[projectId];

    const nextFeeds = { ...feedPosts };
    delete nextFeeds[projectId];

    // 2. Clear out of the core project tracking list
    const nextProjects = projects.filter((p) => p.id !== projectId);

    // 3. Fallback routing redirect check if the user just killed the project they are looking at
    const shouldRedirect = activeProjectId === projectId;

    set({
      projects: nextProjects,
      pages: nextPages,
      changeLog: nextLogs,
      feedPosts: nextFeeds,
      activeProjectId: shouldRedirect ? null : activeProjectId,
      activePageId: shouldRedirect ? null : get().activePageId,
      activeViewMode: shouldRedirect
        ? WorkspaceViewMode.ProjectDashboard
        : get().activeViewMode,
    });
  },

  deletePage: (projectId, pageId) => {
    const { pages, activePageId } = get(); // 🎯 Cleaned: removed activeProjectId
    const currentProjectPages = pages[projectId] || [];

    // 1. Filter out the specific page object key
    const nextProjectPages = currentProjectPages.filter((p) => p.id !== pageId);

    // 2. Redirect back out to the parent Project Dashboard if they deleted their active tab view
    const shouldRedirect = activePageId === pageId;

    set({
      pages: {
        ...pages,
        [projectId]: nextProjectPages,
      },
      activePageId: shouldRedirect ? null : activePageId,
      activeViewMode: shouldRedirect
        ? WorkspaceViewMode.ProjectDashboard
        : get().activeViewMode,
    });
  },
});
