// src/components/Previews/BlockPreviewRenderer.tsx
import React from 'react';
import type { CanvasBlock } from '../../state/types';
import CodePreview from './CodePreview';
import ImagePreview from './ImagePreview';
import TextPreview from './TextPreview';

interface BlockPreviewRendererProps {
  block?: CanvasBlock;
  fallbackChildren?: React.ReactNode;
}

const BlockPreviewRenderer: React.FC<BlockPreviewRendererProps> = ({
  block,
  fallbackChildren,
}) => {
  if (!block) return <>{fallbackChildren}</>;

  switch (block.type) {
    case 'image':
      return (
        <div className="w-full h-full rounded-xl bg-slate-950 overflow-hidden relative flex items-center justify-center">
          <ImagePreview blockId={block.id} content={block.content} />
        </div>
      );
    case 'code':
      return <CodePreview content={block.content} />;
    default:
      return <TextPreview type={block.type} content={block.content} />;
  }
};

export default BlockPreviewRenderer;
