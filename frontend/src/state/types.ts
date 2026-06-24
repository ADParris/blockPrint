// src/state/types.ts
export type BlockType = 'h1' | 'h2' | 'h3' | 'p' | 'code' | 'image';

export const LayoutMode = {
  DocumentCanvas: 'document-canvas',
  SpatialCanvas: 'spatial-canvas',
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

// Our unified block structure supporting both modes
export interface CanvasBlock extends BaseBlock {
  position?: { x: number; y: number };
  connections?: string[];
}

export interface Notebook {
  id: string;
  name: string;
  headerTitle?: string;
  coverImage?: string;
  layoutMode: LayoutModeType;
  blocks: CanvasBlock[];
}

// 🎯 The ONE Master State Interface representing the complete merged store
export interface CanvasState {
  // Global Shared Variables
  notebooks: Notebook[];
  activeNotebookId: string;
  activeBlockId: string;
  isLoading: boolean;

  // Ephemeral Infinite Grid Viewport States
  cameraOffset: XYPosition;
  zoomScale: number;

  setLayoutMode: (mode: LayoutModeType) => void;

  // 🔄 Backend Sync Operations
  loadFromBackend: () => Promise<void>;
  syncToBackend: () => Promise<void>;

  // 📁 Notebook Management Actions
  setActiveNotebookId: (id: string) => void;
  createNotebook: () => string;
  deleteNotebook: (id: string) => void;
  getActiveNotebook: () => Notebook;
  getNotebookTitles: () => { id: string; title: string }[];
  updateNotebookHeader: (
    id: string,
    updates: Partial<
      Pick<Notebook, 'headerTitle' | 'coverImage' | 'layoutMode'>
    >,
  ) => void;
  moveNotebookToIndex: (activeId: string, targetIndex: number) => void;

  // 📝 Standard Document Block Actions
  updateBlockContent: (id: string, newContent: string) => void;
  updateBlockType: (id: string, newType: BlockType) => void;
  deleteBlock: (id: string) => void;
  setActiveBlockId: (id: string) => void;
  moveBlockToIndex: (activeId: string, targetIndex: number) => void;
  insertBlockAtIndex: (targetIndex?: number, initialContent?: string) => string;

  // 🗺️ Spatial Grid / Flowchart Actions
  setCameraOffset: (
    offset: XYPosition | ((prev: XYPosition) => XYPosition),
  ) => void;
  setZoomScale: (scale: number | ((prev: number) => number)) => void;
  updateBlockPosition: (id: string, position: XYPosition) => void;
  addBlockConnection: (sourceId: string, targetId: string) => void;
  removeBlockConnection: (sourceId: string, targetId: string) => void;
}

export type StoreSlice<T> = (
  set: (
    nextState:
      | Partial<CanvasState>
      | ((state: CanvasState) => Partial<CanvasState>),
    replace?: false,
  ) => void,
  get: () => CanvasState,
) => T;

export const CommandMenu = {
  ArrowCommand: 'arrow-command',
  BlockCommand: 'block-command',
} as const;

export type CommandMenuType = (typeof CommandMenu)[keyof typeof CommandMenu];

// types.ts (or wherever your LayoutMode enum lives)
export interface CanvasKeyboardConfig {
  blocks: CanvasBlock[];
  activeBlockId: string | null;
  setActiveBlockId: (id: string | null) => void;
  insertBlockAtIndex: (index: number, type: string) => void;
  deleteBlock: (id: string) => void;
  updateBlockContent: (id: string, content: string) => void;
  isOpen: boolean;
  openMenu: (position: { top: number; left: number }) => void;
  handleClose: () => void;
}
