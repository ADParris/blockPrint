// src/state/projectSlice.ts
import type {
  BaseActionType,
  BaseElementType,
  DropZoneScopeType,
  FeedPost,
  HistoryEntry,
  Page,
  ProgressState,
  Project,
  SidebarElementType,
  StoreSlice,
} from './types';

import {
  BaseAction,
  BaseElement,
  DropZoneScope,
  SidebarElement,
} from './types';

export interface ProjectActions {
  setActiveSidebarDrag: (
    type: SidebarElementType | null,
    scope: DropZoneScopeType | null,
  ) => void;
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
    type: SidebarElementType,
  ) => void;
  deleteProject: (projectId: string | undefined) => void;
  deletePage: (
    projectId: string | undefined,
    pageId: string | undefined,
  ) => void;
}

export const createProjectSlice: StoreSlice<ProjectActions> = (set, get) => ({
  setActiveSidebarDrag: (type, scope) =>
    set({ activeSidebarDragObject: type, activeSidebarDragScope: scope }),

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

  // Update the signature call or utilize the projectId slot to pass scope strings ('personal' | 'team')
  reorderSidebarItems: (scopeOrProjectId, activeIndex, overIndex, type) => {
    const { currentUser, userSortOrders, projects, pages } = get();
    const userId = currentUser?.id || 'default_user';

    const numActive = Number(activeIndex);
    const numOver = Number(overIndex);

    // 🎯 1. UNIFIED PROJECT SORTING (Scope-Aware)
    if (type === SidebarElement.Project) {
      const existingOrder = userSortOrders[userId]?.globalProjectsOrder || [];

      // 🎯 Step A: Get the order of ALL projects first, ensuring everything is tracked
      const allProjectsOrder = [...existingOrder];
      projects.forEach((p) => {
        if (!allProjectsOrder.includes(p.id)) allProjectsOrder.push(p.id);
      });

      // 🎯 Step B: Filter down to ONLY the items visible in the active dragging section scope
      const isGroupSection =
        scopeOrProjectId === 'team' || scopeOrProjectId === DropZoneScope.Group;
      const sectionProjects = projects.filter((p) =>
        isGroupSection ? p.groupId !== null : p.groupId === null,
      );

      // Sort the sub-section projects by their current order so the indexes match the screen exactly!
      const sortedSectionIds = sectionProjects
        .sort(
          (a, b) =>
            allProjectsOrder.indexOf(a.id) - allProjectsOrder.indexOf(b.id),
        )
        .map((p) => p.id);

      // 🎯 Step C: Perform the splice safely inside the section limits
      if (
        numActive >= 0 &&
        numActive < sortedSectionIds.length &&
        numOver >= 0 &&
        numOver <= sortedSectionIds.length
      ) {
        const [movedId] = sortedSectionIds.splice(numActive, 1);

        // Adjust boundary if dragging down past itself
        const adjustedOver = numOver > numActive ? numOver - 1 : numOver;
        sortedSectionIds.splice(adjustedOver, 0, movedId);

        // 🎯 Step D: Re-weave the freshly sorted section IDs back into the master global track list
        const finalGlobalOrder = allProjectsOrder.filter(
          (id) => !sortedSectionIds.includes(id),
        );

        // Insert the sorted section subset back into the global list where the section originally belonged
        const targetInsertIndex = allProjectsOrder.findIndex((id) =>
          isGroupSection
            ? projects.find((p) => p.id === id)?.groupId !== null
            : projects.find((p) => p.id === id)?.groupId === null,
        );

        if (targetInsertIndex === -1) {
          finalGlobalOrder.push(...sortedSectionIds);
        } else {
          finalGlobalOrder.splice(targetInsertIndex, 0, ...sortedSectionIds);
        }

        set({
          userSortOrders: {
            ...userSortOrders,
            [userId]: {
              ...(userSortOrders[userId] || { projectPagesOrder: {} }),
              globalProjectsOrder: finalGlobalOrder,
            },
          },
        });
      }
      return;
    }

    // 🎯 2. UNIFIED PAGE SORTING (Stays exactly the same)
    if (type === SidebarElement.Page && scopeOrProjectId) {
      const fallbackPages = (pages[scopeOrProjectId] || []).map((p) => p.id);
      const userRoot = userSortOrders[userId] || {
        globalProjectsOrder: [],
        projectPagesOrder: {},
      };
      const currentPagesOrder = [
        ...(userRoot.projectPagesOrder[scopeOrProjectId] || fallbackPages),
      ];

      if (
        numActive >= 0 &&
        numActive < currentPagesOrder.length &&
        numOver >= 0 &&
        numOver <= currentPagesOrder.length
      ) {
        const [removed] = currentPagesOrder.splice(numActive, 1);
        currentPagesOrder.splice(numOver, 0, removed);
      }

      set({
        userSortOrders: {
          ...userSortOrders,
          [userId]: {
            ...userRoot,
            projectPagesOrder: {
              ...userRoot.projectPagesOrder,
              [scopeOrProjectId]: currentPagesOrder,
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
