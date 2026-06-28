// src/state/types.ts

// --- 1. Core Core Layout & Canvas Geometries (Preserved Exactly) ---
export type AnchorDirection = 'top' | 'right' | 'bottom' | 'left';

export interface BlockConnection {
  targetId: string;
  sourceDir: AnchorDirection;
  targetDir: AnchorDirection;
}

export type BlockType = 'h1' | 'h2' | 'h3' | 'p' | 'code' | 'image';

export const LayoutMode = {
  DocumentCanvas: 'DOCUMENT_CANVAS',
  SpatialCanvas: 'SPATIAL_CANVAS',
} as const;

export type LayoutModeType = (typeof LayoutMode)[keyof typeof LayoutMode];

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

export type ProgressState = 'Pending' | 'InProgress' | 'Done';
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

// A Page now owns the structural canvas/document blocks that used to sit on the Notebook
export interface Page {
  id: string;
  projectId: string;
  title: string;
  status: ProgressState;
  layoutMode: LayoutModeType;
  blocks: CanvasBlock[];
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
export const CommandMenu = {
  ArrowCommand: 'ARROW_COMMAND',
  BlockCommand: 'BLOCK_COMMAND',
} as const;

export type CommandMenuType = (typeof CommandMenu)[keyof typeof CommandMenu];

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
  activeProjectId: string | null;
  activePageId: string | null;
  activeBlockId: string | null;
  activeViewMode: WorkspaceViewModeType;
  isLoading: boolean;
  imageCache: Record<string, string>;

  // --- 3. Ephemeral Infinite Grid Viewport States ---
  cameraOffset: XYPosition;
  zoomScale: number;

  // --- 4. Project Slice Actions ---
  setActiveProjectId: (id: string | null) => void;
  setActivePageId: (id: string | null) => void;
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
  reorderSidebarItems: (
    projectId: string | null, // null for top-level global project folders
    activeIndex: number,
    overIndex: number,
    type: Omit<BaseElementType, 'Block'>,
  ) => void;
  deleteProject: (projectId: string) => void;
  deletePage: (projectId: string, pageId: string) => void;

  // --- 5. Document Slice Actions ---
  updateBlockContent: (id: string, newContent: string) => void;
  updateBlockType: (id: string, newType: BlockType) => void;
  deleteBlock: (id: string) => void;
  setActiveBlockId: (id: string | null) => void;
  moveBlockToIndex: (activeId: string, targetIndex: number) => void;
  insertBlockAtIndex: (targetIndex?: number, initialContent?: string) => string;

  // --- 6. Canvas Slice Actions ---
  setLayoutMode: (mode: LayoutModeType) => void; // 🎯 Added missing toggle handle contract
  setCameraOffset: (
    offset: XYPosition | ((prev: XYPosition) => XYPosition),
  ) => void;
  setZoomScale: (scale: number | ((prev: number) => number)) => void;
  updateBlockPosition: (id: string, position: XYPosition) => void;
  addBlockConnectionByKey: (connectionKey: string) => void;
  removeBlockConnectionByKey: (connectionKey: string) => void;

  // --- 7. Image Slice Actions ---
  setImageCacheUrl: (blockId: string, url: string) => void;
  clearImageCache: () => void;

  // --- 8. Core Sync Actions ---
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
