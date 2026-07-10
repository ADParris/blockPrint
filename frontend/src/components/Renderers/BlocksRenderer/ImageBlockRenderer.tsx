import React from 'react';
import ImageBlock from '../../ImageBlock';
import type { BlockContentRendererProps } from './types';

const ImageBlockRenderer: React.FC<BlockContentRendererProps> = ({
  block,
  onContentChange,
}) => {
  return (
    <ImageBlock
      blockId={block.id}
      content={block.content}
      onContentChange={onContentChange}
    />
  );
};

export default ImageBlockRenderer;
