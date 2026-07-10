// src/components/Previews/BlockPreviewRenderer.tsx
import React from 'react';
import { useParams } from 'react-router-dom'; // 🎯 Pull params natively
import { type CanvasBlock, ActivityFeedItems } from '../../state/types';
import { useProjectStore } from '../../state/useProjectStore'; // 🎯 Grab your store
import CodePreview from './CodePreview';
import ImagePreview from './ImagePreview';
import StubPreview from './StubPreview';
import TextPreview from './TextPreview';

interface BlockPreviewRendererProps {
  block?: CanvasBlock;
  fallbackChildren?: React.ReactNode;
}

const BlockPreviewRenderer: React.FC<BlockPreviewRendererProps> = ({
  block,
  fallbackChildren,
}) => {
  // 🎯 INTERNAL CROSS-REFERENCE: Look up project feed status directly inside the component body!
  const { projectId } = useParams<{ projectId: string }>();
  const targetProjectId = projectId || 'default-project';

  const isStub = useProjectStore((state) => {
    const projectFeed = state.activityFeedItems[targetProjectId] || [];
    return projectFeed.some(
      (item) =>
        item.targetBlockId === block?.id &&
        item.type === ActivityFeedItems.Stub,
    );
  });

  if (!block) return <>{fallbackChildren}</>;

  if (isStub) {
    return <StubPreview content={block.content} />;
  }

  switch (block.type) {
    case 'image':
      return (
        <div className="w-full h-full rounded-xl bg-surface overflow-hidden relative flex items-center justify-center">
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
