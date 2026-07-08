import React, { useEffect, useState } from 'react';
import type { BlockType, CanvasBlock } from '../state/types';
import { useProjectStore } from '../state/useProjectStore';
import ImageBlock from './ImageBlock';

// Helper function to break up consecutive digits for extension scanners
const breakNumberScanners = (text: string): string => {
  // If the text is purely a long sequence of numbers (like 7+ digits)
  if (/^\d{7,}$/.test(text.trim())) {
    return text.charAt(0) + '\u200B' + text.slice(1);
  }
  return text;
};

// Helper to clean the text back up when saving to the Zustand store
const cleanZeroWidthSpaces = (text: string): string => {
  return text.replace(/\u200B/g, '');
};

interface BlockProps {
  projectId: string;
  pageId: string;
  block: CanvasBlock;
  index: number; // Optional index for ordered lists
}

const BlockRenderer: React.FC<BlockProps> = ({
  projectId,
  pageId,
  block,
  index,
}) => {
  const updateBlockContent = useProjectStore(
    (state) => state.updateBlockContent,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState<string>('');

  // 💡 Optimization: ONLY run the Shiki compiler if this block is actually a 'code' block!
  useEffect(() => {
    if (block.type !== 'code') return;
    let cancelled = false;

    const highlightCode = async () => {
      const codeRaw = block.content || '// Click to add code...';
      try {
        const { highlightTsxToHtml } =
          await import('../utils/shikiHighlighter');
        const html = await highlightTsxToHtml(codeRaw);
        if (!cancelled) {
          setHighlightedHtml(html);
        }
      } catch (err) {
        console.error('Shiki highlighting failed:', err);
      }
    };

    highlightCode();

    return () => {
      cancelled = true;
    };
  }, [block.content, block.type]);

  const handleDragStart = (e: React.DragEvent) => {
    // 🎯 Pack the numerical index position straight into the event transfer!
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.setData(
      `application/x-${block.type.toLowerCase()}`,
      String(index),
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Clean out the zero-width space before committing to IndexedDB/Zustand store!
    const rawValue = cleanZeroWidthSpaces(e.target.value);
    updateBlockContent(projectId, pageId, block.id, rawValue);
  };

  const timelineItem = useProjectStore((state) => {
    const feed = state.activityFeedItems[projectId] || [];
    return feed.find((item) => item.targetBlockId === block.id);
  });

  // Determine status formatting strings
  const isStub = timelineItem?.type === 'STUB';
  const isNote = timelineItem?.type === 'NOTE';

  // Generate dynamic border frames
  const wrapperBorderClass = isStub
    ? 'border-amber-500/50 shadow-amber-950/10'
    : isNote
      ? 'border-sky-500/50 shadow-sky-950/10'
      : 'border-transparent';

  let elementToRender: React.ReactNode;

  if (block.type === 'code') {
    if (isEditing) {
      elementToRender = (
        <textarea
          // Use the display helper to shield the phone number
          defaultValue={breakNumberScanners(block.content)}
          data-block-id={block.id}
          onChange={handleTextareaChange}
          onBlur={() => setIsEditing(false)}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false} // Code blocks stay clean of red squiggles
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
        onContentChange={(newContent) =>
          updateBlockContent(projectId, pageId, block.id, newContent)
        }
      />
    );
  } else if (block.type === 'bullet' || block.type === 'number') {
    // 🎯 Calculate the dynamic serial position for ordered items
    let listNumber = 1;
    if (block.type === 'number') {
      const projectPages = useProjectStore.getState().pages[projectId] || [];
      const currentPage = projectPages.find((page) => page.id === pageId);
      const blocks = currentPage?.blocks || [];
      const currentIndex = blocks.findIndex((b) => b.id === block.id);

      // Count backwards to find how many consecutive number blocks precede this one
      for (let i = currentIndex - 1; i >= 0; i--) {
        if (blocks[i].type === 'number') {
          listNumber++;
        } else {
          break; // Stop counting if the sequence breaks
        }
      }
    }

    elementToRender = (
      <div className="flex items-start w-full gap-2 my-0.5 text-base leading-relaxed">
        {/* Non-interactive List Marker */}
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
          spellCheck={true} // ✨ Grammarly and spellcheck enabled!
          className="w-full field-sizing-content resize-none bg-transparent text-slate-100 outline-none border-none wrap-break-words overflow-hidden whitespace-pre-wrap"
          rows={1}
        />
      </div>
    );
  } else {
    const styleMap: Record<
      Exclude<BlockType, 'code' | 'image' | 'bullet' | 'number'>,
      string
    > = {
      h1: 'text-3xl font-bold tracking-tight my-2',
      h2: 'text-2xl font-semibold tracking-tight my-1.5',
      h3: 'text-xl font-medium tracking-tight my-1',
      p: 'text-base leading-relaxed my-0.5',
    };

    elementToRender = (
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
        spellCheck={true} // ✨ Grammarly and spellcheck enabled!
        className={`w-full field-sizing-content resize-none bg-transparent text-slate-100 outline-none border-none wrap-break-words overflow-hidden whitespace-pre-wrap ${
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
  }

  return (
    <div
      id={`block-${block.id}`}
      className={`group relative flex flex-col items-start w-full pl-8 pr-4 min-h-7 py-2.5 my-1.5 rounded-lg border transition-all duration-200 ${wrapperBorderClass}`}
    >
      {/* 🎯 CORNER BADGE ELEMENT: Only shows up if this block is linked to the feed */}
      {timelineItem && (
        <div
          className={`absolute -top-2.5 right-4 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase select-none border shadow-sm z-10
          ${
            isStub
              ? 'bg-amber-950/80 text-amber-400 border-amber-600/40'
              : 'bg-sky-950/80 text-sky-400 border-sky-600/40'
          }`}
        >
          {timelineItem.type}
        </div>
      )}

      {/* Drag Handle */}
      <div
        className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group/handle group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 select-none hover:z-50"
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
