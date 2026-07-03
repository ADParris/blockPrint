// src/state/types.ts

// --- 1. Core Core Layout & Canvas Geometries (Preserved Exactly) ---
export type AnchorDirection = 'top' | 'right' | 'bottom' | 'left';

export const BlockConnectionColors = [
  'blue',
  'emerald',
  'rose',
  'amber',
] as const;

export type BlockConnectionColor = (typeof BlockConnectionColors)[number];

export interface BlockConnection {
  targetId: string;
  sourceDir: AnchorDirection;
  targetDir: AnchorDirection;
  color?: BlockConnectionColor;
}

export type BlockType =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'p'
  | 'bullet'
  | 'number'
  | 'code'
  | 'image';

export interface XYPosition {
  x: number;
  y: number;
}

export interface BaseBlock {
  id: string;
  type: BlockType;
  content: string;
  metadata?: {
    language?: string;
    complete?: boolean;
  };
}

export interface CanvasBlock extends BaseBlock {
  position?: { x: number; y: number };
  connections?: BlockConnection[];
  kanban?: {
    columnId: ProgressState; // 'Pending' | 'In Progress' | 'Completed'
    orderIndex: number;
  };
}

// --- 2. Collaboration & Status Schemas (New Additions) ---
export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface Group {
  id: string;
  name: string;
  slug: string; // 💡 e.g., "design-team" or "marketing-group" used directly in your URLs
  memberIds: string[];
}

export interface UserProjectOrders {
  globalProjectsOrder: string[]; // Sequence of top-level folder IDs
  projectPagesOrder: Record<string, string[]>; // Map of projectId -> sorted pageId[]
}

export type ProgressState = 'Pending' | 'InProgress' | 'Completed';
export type ProjectStatus = 'On Track' | 'At Risk' | 'Delayed';

export interface HistoryEntry {
  id: string;
  timestamp: number;
  userId: string;
  userName: string;
  actionType: BaseActionType;
  targetType: BaseElementType;
  targetName: string;
  details?: string; // e.g., "Moved from Pending to InProgress"
}

export const WorkspaceViewMode = {
  ProjectDashboard: 'PROJECT_DASHBOARD',
  PageDocument: 'PAGE_DOCUMENT',
  PageCanvas: 'PAGE_CANVAS',
  PageKanban: 'PAGE_KANBAN',
} as const;

export type WorkspaceViewModeType =
  (typeof WorkspaceViewMode)[keyof typeof WorkspaceViewMode];

export interface FeedPost {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
  likes: string[]; // Array of User IDs
}

export interface ChangeLogEntry {
  id: string;
  projectId: string;
  action: string;
  details?: string;
  version?: string;
  timestamp: number;
}

// --- 3. Shifting Notebooks to Projects & Pages ---
export interface KanbanColumn {
  id: ProgressState; // e.g., 'Pending', 'In Progress', 'Completed'
  label: string;
}

export interface GenericKanbanItem {
  id: string;
  kanban?: {
    columnId: ProgressState; // 'Pending' | 'In Progress' | 'Completed'
    orderIndex: number;
  };
}

export interface Page {
  id: string;
  projectId: string;
  title: string;
  status: ProgressState;
  blocks: CanvasBlock[];
  kanban?: {
    columnId: ProgressState; // 'Pending' | 'In Progress' | 'Completed'
    orderIndex: number;
  };
  headerTitle?: string;
  coverImage?: string;
  lastEditedBy: {
    userId: string;
    userName: string;
    timestamp: number;
  };
}

// The structural umbrella tracking metadata, team access, and timeline state
export interface Project {
  id: string;
  name: string;
  description?: string;
  groupId: string | null; // 💡 NEW: null = Personal Project, otherwise links to a Group.id
  isPublicShareable: boolean;
  headerTitle?: string;
  coverImage?: string;
  createdAt: number;
  deadline?: number;
  status: ProjectStatus;
  teamMembers: string[]; // Array of User IDs`
}

// --- 4. Ephemeral UI Commands & Menus (Preserved) ---
export const CommandMenus = {
  ArrowCommand: 'ARROW_COMMAND',
  BlockCommand: 'BLOCK_COMMAND',
} as const;

export type CommandMenusType = (typeof CommandMenus)[keyof typeof CommandMenus];

export const BaseElement = {
  Project: 'PROJECT',
  Page: 'PAGE',
  Block: 'BLOCK',
} as const;

export type BaseElementType = (typeof BaseElement)[keyof typeof BaseElement];

export const BaseAction = {
  Create: 'CREATE',
  Update: 'UPDATE',
  Delete: 'DELETE',
  Move: 'MOVE',
} as const;

export type BaseActionType = (typeof BaseAction)[keyof typeof BaseAction];

// 🎯 The Master State Interface representing the complete merged project store

export interface ProjectState {
  // --- 1. State Collections & Identity ---
  currentUser: User | null;
  users: Record<string, User>;
  groups: Record<string, Group>;
  projects: Project[];
  pages: Record<string, Page[]>;
  userSortOrders: Record<string, UserProjectOrders>;
  changeLog: Record<string, HistoryEntry[]>;
  feedPosts: Record<string, FeedPost[]>;

  // --- 2. Ephemeral UI & Active Selections ---
  activeBlockId: string | null;
  isLoading: boolean;
  imageCache: Record<string, string>;

  // --- 3. Ephemeral Infinite Grid Viewport States ---
  cameraOffset: XYPosition;
  zoomScale: number;

  // --- 4. Project Slice Actions ---
  addProject: (
    name: string,
    description?: string,
    groupId?: string | null,
  ) => string;
  addPage: (projectId: string | undefined, title: string) => string;
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

  // --- 5. Document Slice Actions ---
  insertBlockAtIndex: (
    projectId: string | undefined,
    pageId: string | undefined,
    targetIndex?: number,
    initialContent?: string,
    type?: BlockType, // Optional parameter to specify the block type
  ) => string;
  updateBlockContent: (
    projectId: string | undefined,
    pageId: string | undefined,
    id: string,
    newContent: string,
  ) => void;
  updateBlockType: (
    projectId: string | undefined,
    pageId: string | undefined,
    id: string,
    newType: BlockType,
  ) => void;
  deleteBlock: (
    projectId: string | undefined,
    pageId: string | undefined,
    id: string,
  ) => void;
  moveBlockToIndex: (
    projectId: string | undefined,
    pageId: string | undefined,
    activeId: string,
    targetIndex: number,
  ) => void;
  setActiveBlockId: (id: string | null) => void;

  // --- 6. Canvas Slice Actions ---
  setCameraOffset: (
    offset: XYPosition | ((prev: XYPosition) => XYPosition),
  ) => void;
  setZoomScale: (scale: number | ((prev: number) => number)) => void;
  updateBlockPosition: (
    projectId: string | undefined,
    pageId: string | undefined,
    blockId: string,
    position: XYPosition,
  ) => void;
  addBlockConnectionByKey: (
    projectId: string | undefined,
    pageId: string | undefined,
    connectionKey: string,
  ) => void;
  removeBlockConnectionByKey: (
    projectId: string | undefined,
    pageId: string | undefined,
    connectionKey: string,
  ) => void;
  updateBlockConnectionColor: (
    projectId: string | undefined,
    pageId: string | undefined,
    connectionKey: string,
    color: BlockConnectionColor,
  ) => void;

  // --- 7. Image Slice Actions ---
  setImageCacheUrl: (blockId: string, url: string) => void;
  clearImageCache: () => void;

  // --- 8. Kanban Slice Actions ---
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

  // --- 9. Core Sync Actions ---
  loadFromBackend: () => Promise<void>;
  syncToBackend: () => Promise<void>;
}

// Your updated StoreSlice matching the above
export type StoreSlice<T> = (
  set: (
    nextState:
      | Partial<ProjectState>
      | ((state: ProjectState) => Partial<ProjectState>),
    replace?: false,
  ) => void,
  get: () => ProjectState,
) => T;
