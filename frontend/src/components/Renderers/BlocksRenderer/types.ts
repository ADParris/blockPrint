import type { CanvasBlock } from '../../../state/types';

export interface BlockRendererProps {
  projectId: string;
  pageId: string;
  block: CanvasBlock;
  index: number;
}

export interface BlockContentRendererProps {
  projectId: string;
  pageId: string;
  block: CanvasBlock;
  onContentChange: (content: string) => void;
}
