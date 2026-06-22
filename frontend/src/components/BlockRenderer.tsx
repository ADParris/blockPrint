import React, { useEffect, useState } from 'react';
import { codeToHtml } from 'shiki';
import type { Block, BlockType } from '../state/useCanvasStore';
import useCanvasStore from '../state/useCanvasStore';
import { ImageBlock } from './ImageBlock';

interface BlockProps {
  block: Block;
}

const BlockRenderer: React.FC<BlockProps> = ({ block }) => {
  const updateBlockContent = useCanvasStore(
    (state) => state.updateBlockContent,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState<string>('');

  // 💡 Optimization: ONLY run the Shiki compiler if this block is actually a 'code' block!
  useEffect(() => {
    if (block.type !== 'code') return;

    const highlightCode = async () => {
      const codeRaw = block.content || '// Click to add code...';
      try {
        const html = await codeToHtml(codeRaw, {
          lang: 'tsx',
          theme: 'dark-plus',
        });
        setHighlightedHtml(html);
      } catch (err) {
        console.error('Shiki highlighting failed:', err);
      }
    };

    highlightCode();
  }, [block.content, block.type]);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', block.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  let elementToRender: React.ReactNode;

  if (block.type === 'code') {
    if (isEditing) {
      elementToRender = (
        <textarea
          defaultValue={block.content}
          data-block-id={block.id}
          onChange={(e) => updateBlockContent(block.id, e.target.value)}
          onBlur={() => setIsEditing(false)}
          className="w-full field-sizing-content min-h-32 max-h-128 p-4 bg-[#1e1e1e] font-mono text-sm text-slate-100 rounded-lg border border-slate-800 outline-none overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 resize-none whitespace-pre-wrap"
          placeholder="// Type your code here..."
          autoFocus
        />
      );
    } else {
      elementToRender = (
        <div
          className="group/code relative w-full my-4 bg-[#1e1e1e] rounded-lg border border-slate-800/60 font-mono text-sm overflow-hidden shadow-xl cursor-text"
          onClick={() => setIsEditing(true)}
        >
          {/* Toolbar */}
          <div
            className="absolute top-2 right-2 opacity-0 group-hover/code:opacity-100 transition-opacity duration-150 flex items-center gap-2 bg-slate-800/80 backdrop-blur-sm px-2 py-1 rounded border border-slate-700 text-xs text-slate-400 select-none z-10"
            contentEditable={false}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="font-sans font-medium text-slate-300 hover:text-white cursor-pointer">
              TypeScript
            </span>
            <div className="w-px h-3 bg-slate-700 mx-1" />
            <button className="hover:text-slate-200">Format</button>
            <button className="hover:text-slate-200 ml-1">Copy</button>
          </div>

          <div
            className="p-4 h-112 max-h-128 overflow-auto scrollbar-thin scrollbar-thumb-slate-800 shiki-container"
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        </div>
      );
    }
  } else if (block.type === 'image') {
    elementToRender = (
      <ImageBlock
        blockId={block.id}
        content={block.content}
        onContentChange={updateBlockContent}
      />
    );
  } else {
    const styleMap: Record<Exclude<BlockType, 'code' | 'image'>, string> = {
      h1: 'text-3xl font-bold tracking-tight my-2',
      h2: 'text-2xl font-semibold tracking-tight my-1.5',
      h3: 'text-xl font-medium tracking-tight my-1',
      p: 'text-base leading-relaxed my-0.5',
    };

    elementToRender = (
      <textarea
        value={block.content}
        data-block-id={block.id}
        onChange={(e) => updateBlockContent(block.id, e.target.value)}
        placeholder={
          block.type === 'h1'
            ? 'Heading 1'
            : block.type === 'h2'
              ? 'Heading 2'
              : 'Type text here...'
        }
        className={`w-full field-sizing-content resize-none bg-transparent text-slate-100 outline-none border-none wrap-break-words overflow-hidden whitespace-pre-wrap ${
          styleMap[block.type as Exclude<BlockType, 'code' | 'image'>] ||
          styleMap.p
        }`}
        rows={1}
      />
    );
  }

  return (
    <div className="group relative flex items-start w-full pl-8 pr-4 min-h-7">
      {/* Drag Handle */}
      <div
        className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group/handle group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 select-none  hover:z-50"
        contentEditable={false}
        data-drag-handle-for={block.id}
        draggable
        onDragStart={handleDragStart}
      >
        <svg width="12" height="18" viewBox="0 0 12 24" fill="currentColor">
          <circle cx="2" cy="4" r="1.5" />
          <circle cx="2" cy="12" r="1.5" />
          <circle cx="2" cy="20" r="1.5" />
          <circle cx="10" cy="4" r="1.5" />
          <circle cx="10" cy="12" r="1.5" />
          <circle cx="10" cy="20" r="1.5" />
        </svg>
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover/handle:flex flex-col items-center bg-[#0f1115] border border-slate-800 text-[11px] leading-relaxed text-slate-300 px-2.5 py-1.5 rounded-md shadow-2xl pointer-events-none whitespace-nowrap z-50 text-center">
          <span>Drag to move.</span>
          <span className="text-slate-400 text-[10px]">
            Click to open menu.
          </span>
        </div>
      </div>

      <div className="w-full">{elementToRender}</div>
    </div>
  );
};

export default BlockRenderer;
