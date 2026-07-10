import React from 'react';
import { useProjectStore } from '../../../state/useProjectStore';
import { breakNumberScanners } from './textUtils';
import type { BlockContentRendererProps } from './types';

const ListBlockRenderer: React.FC<BlockContentRendererProps> = ({
  projectId,
  pageId,
  block,
  onContentChange,
}) => {
  let listNumber = 1;

  if (block.type === 'number') {
    const projectPages = useProjectStore.getState().pages[projectId] || [];
    const currentPage = projectPages.find((page) => page.id === pageId);
    const blocks = currentPage?.blocks || [];
    const currentIndex = blocks.findIndex((b) => b.id === block.id);

    for (let i = currentIndex - 1; i >= 0; i--) {
      if (blocks[i].type === 'number') {
        listNumber++;
      } else {
        break;
      }
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onContentChange(e.target.value);
  };

  return (
    <div className="flex items-start w-full gap-2 my-0.5 text-base leading-relaxed">
      <div
        className="flex items-center justify-end min-w-6 select-none text-slate-400 font-medium pt-0.75"
        contentEditable={false}
      >
        {block.type === 'bullet' ? (
          <span className="text-lg leading-none select-none">•</span>
        ) : (
          <span className="text-sm font-mono tracking-tighter select-none">
            {listNumber}.
          </span>
        )}
      </div>

      <textarea
        value={breakNumberScanners(block.content)}
        data-block-id={block.id}
        onChange={handleTextareaChange}
        placeholder="List item"
        spellCheck={true}
        className="w-full field-sizing-content resize-none bg-transparent text-slate-100 outline-none border-none wrap-break-words overflow-hidden whitespace-pre-wrap"
        rows={1}
      />
    </div>
  );
};

export default ListBlockRenderer;
