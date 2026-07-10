import React, { useEffect, useState } from 'react';
import { breakNumberScanners } from './textUtils';
import type { BlockContentRendererProps } from './types';

const CodeBlockRenderer: React.FC<BlockContentRendererProps> = ({
  block,
  onContentChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    const highlightCode = async () => {
      const codeRaw = block.content || '// Click to add code...';
      try {
        const { highlightTsxToHtml } =
          await import('../../../utils/shikiHighlighter');
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
  }, [block.content]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onContentChange(e.target.value);
  };

  if (isEditing) {
    return (
      <textarea
        defaultValue={breakNumberScanners(block.content)}
        data-block-id={block.id}
        onChange={handleTextareaChange}
        onBlur={() => setIsEditing(false)}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className="w-full field-sizing-content min-h-32 max-h-128 p-4 bg-surface-elevated font-mono text-sm text-fg rounded-lg border border-line outline-none overflow-y-auto scrollbar-thin scrollbar-thumb-bg-surface resize-none whitespace-pre-wrap"
        placeholder="// Type your code here..."
        autoFocus
      />
    );
  }

  return (
    <div
      className="group/code relative w-full my-4 bg-surface rounded-lg border border-line font-mono text-sm overflow-hidden shadow-xl cursor-text"
      onClick={() => setIsEditing(true)}
    >
      <div
        className="absolute top-2 right-3 opacity-0 group-hover/code:opacity-100 transition-opacity duration-150 flex items-center gap-2 bg-surface backdrop-blur-sm px-2 py-1 rounded border border-line text-xs text-fg select-none z-10"
        contentEditable={false}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="font-sans font-medium text-fg-muted hover:text-white cursor-pointer">
          TypeScript
        </span>
        <div className="w-px h-3 bg-surface mx-2" />
        <button className="text-fg-muted hover:text-fg">Format</button>
        <button className="text-fg-muted hover:text-fg ml-1">Copy</button>
      </div>

      <div
        className="h-112 max-h-128 overflow-auto scrollbar-thin scrollbar-thumb-surface-elevated shiki-container"
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      />
    </div>
  );
};

export default CodeBlockRenderer;
