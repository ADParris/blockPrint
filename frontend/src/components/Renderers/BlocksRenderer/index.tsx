import React from 'react';
import { useProjectStore } from '../../../state/useProjectStore';
import BlockShell from './BlockShell';
import CodeBlockRenderer from './CodeBlockRenderer';
import ImageBlockRenderer from './ImageBlockRenderer';
import ListBlockRenderer from './ListBlockRenderer';
import TextBlockRenderer from './TextBlockRenderer';
import type { BlockContentRendererProps, BlockRendererProps } from './types';

const cleanZeroWidthSpaces = (text: string): string => {
  return text.replace(/\u200B/g, '');
};

const BlockContentRendererSelector: React.FC<BlockContentRendererProps> = (
  props,
) => {
  if (props.block.type === 'code') {
    return <CodeBlockRenderer {...props} />;
  }

  if (props.block.type === 'image') {
    return <ImageBlockRenderer {...props} />;
  }

  if (props.block.type === 'bullet' || props.block.type === 'number') {
    return <ListBlockRenderer {...props} />;
  }

  return <TextBlockRenderer {...props} />;
};

const BlocksRenderer: React.FC<BlockRendererProps> = ({
  projectId,
  pageId,
  block,
  index,
}) => {
  const updateBlockContent = useProjectStore(
    (state) => state.updateBlockContent,
  );

  const handleContentChange = (value: string) => {
    const rawValue = cleanZeroWidthSpaces(value);
    updateBlockContent(projectId, pageId, block.id, rawValue);
  };

  const timelineItem = useProjectStore((state) => {
    const feed = state.activityFeedItems[projectId] || [];
    return feed.find((item) => item.targetBlockId === block.id);
  });

  return (
    <BlockShell
      blockId={block.id}
      blockType={block.type}
      index={index}
      statusType={timelineItem?.type ?? null}
    >
      <BlockContentRendererSelector
        projectId={projectId}
        pageId={pageId}
        block={block}
        onContentChange={handleContentChange}
      />
    </BlockShell>
  );
};

export default BlocksRenderer;
export type { BlockContentRendererProps, BlockRendererProps } from './types';
