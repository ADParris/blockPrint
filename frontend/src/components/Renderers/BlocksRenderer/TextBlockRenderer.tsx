import React from 'react';
import type { BlockType } from '../../../state/types';
import { breakNumberScanners } from './textUtils';
import type { BlockContentRendererProps } from './types';

const styleMap: Record<
  Exclude<BlockType, 'code' | 'image' | 'bullet' | 'number'>,
  string
> = {
  h1: 'text-3xl font-bold tracking-tight my-2',
  h2: 'text-2xl font-semibold tracking-tight my-1.5',
  h3: 'text-xl font-medium tracking-tight my-1',
  p: 'text-base leading-relaxed ml-0.75 mt-0.75',
};

const TextBlockRenderer: React.FC<BlockContentRendererProps> = ({
  block,
  onContentChange,
}) => {
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onContentChange(e.target.value);
  };

  return (
    <textarea
      value={breakNumberScanners(block.content)}
      data-block-id={block.id}
      onChange={handleTextareaChange}
      placeholder={
        block.type === 'h1'
          ? 'Heading 1'
          : block.type === 'h2'
            ? 'Heading 2'
            : 'Type text here...'
      }
      spellCheck={true}
      className={`w-full field-sizing-content resize-none bg-transparent text-fg outline-none border-none wrap-break-words overflow-hidden whitespace-pre-wrap ${
        styleMap[
          block.type as Exclude<
            BlockType,
            'code' | 'image' | 'bullet' | 'number'
          >
        ] || styleMap.p
      }`}
      rows={1}
    />
  );
};

export default TextBlockRenderer;
