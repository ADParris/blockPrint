import { useEffect, useRef, useState } from 'react'; // 🎯 Track explicit action state
import type { Notebook } from '../state/useCanvasStore';
import useCanvasStore from '../state/useCanvasStore';
import { ImageBlock } from './ImageBlock';

interface NotebookHeaderProps {
  notebook: Notebook;
}

function NotebookHeader({ notebook }: NotebookHeaderProps) {
  const { updateNotebookHeader } = useCanvasStore((state) => state);
  const inputRef = useRef<HTMLInputElement>(null);

  // 🎯 Track if the user explicitly clicked the button during this viewing session
  const [isUserAddingTitle, setIsUserAddingTitle] = useState(false);

  const handleCoverChange = (_id: string, newContent: string) => {
    updateNotebookHeader(notebook.id, { coverImage: newContent || undefined });
  };

  const hasCover = !!notebook.coverImage;
  const hasTitleIntent =
    notebook.headerTitle !== undefined &&
    notebook.headerTitle !== 'Untitled Notebook';

  // 🎯 Only snap keyboard focus if the intent is there AND they explicitly clicked the action button
  useEffect(() => {
    if (hasTitleIntent && isUserAddingTitle && inputRef.current) {
      inputRef.current.focus();
      setIsUserAddingTitle(false); // Reset immediately once focus is captured
    }
  }, [hasTitleIntent, isUserAddingTitle]);

  return (
    <div className="group header-group relative w-full mb-8 min-h-10">
      {/* 1. Hover Action Context Bar */}
      {(!hasCover || !hasTitleIntent) && (
        <div className="absolute -top-6 left-0 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out z-10 select-none bg-[#0b0f19]/80 backdrop-blur-sm px-2 py-1 rounded border border-slate-800/40 shadow-md">
          {!hasCover && (
            <button
              onClick={() =>
                updateNotebookHeader(notebook.id, {
                  coverImage: 'PENDING_UPLOAD',
                })
              }
              className="text-xs text-slate-400 hover:text-indigo-400 font-medium transition-colors cursor-pointer"
            >
              📷 Add cover
            </button>
          )}
          {!hasCover && !hasTitleIntent && (
            <span className="text-slate-700 text-xs">|</span>
          )}
          {!hasTitleIntent && (
            <button
              onClick={() => {
                setIsUserAddingTitle(true); // 🎯 Signals that focus is allowed
                updateNotebookHeader(notebook.id, { headerTitle: '' });
              }}
              className="text-xs text-slate-400 hover:text-indigo-400 font-medium transition-colors cursor-pointer"
            >
              ✍️ Add title
            </button>
          )}
        </div>
      )}

      {/* 2. Cover Image Layer */}
      {hasCover && (
        <ImageBlock
          blockId={notebook.id}
          content={notebook.coverImage || ''}
          onContentChange={handleCoverChange}
          variant="cover"
        />
      )}

      {/* 3. Document Title Input */}
      {hasTitleIntent && (
        <input
          ref={inputRef}
          type="text"
          data-block-id="header-title"
          value={notebook.headerTitle}
          onChange={(e) =>
            updateNotebookHeader(notebook.id, { headerTitle: e.target.value })
          }
          onKeyDown={(e) => {
            if (e.key === 'Backspace') {
              const input = e.currentTarget;

              // 🎯 Fix 1: If text is highlighted (even including index 0), do not intercept!
              if (input.selectionStart !== input.selectionEnd) {
                return;
              }

              // 🎯 Fix 2: Only intercept when the single cursor is sitting completely empty at index 0
              const isAtStart =
                input.selectionStart === 0 && input.selectionEnd === 0;
              const isFieldEmpty =
                !notebook.headerTitle || notebook.headerTitle.trim() === '';

              if (isAtStart || isFieldEmpty) {
                e.preventDefault();
                updateNotebookHeader(notebook.id, {
                  headerTitle: 'Untitled Notebook',
                });
              }
            }
          }}
          onBlur={() => {
            if (!notebook.headerTitle || notebook.headerTitle.trim() === '') {
              updateNotebookHeader(notebook.id, {
                headerTitle: 'Untitled Notebook',
              });
            }
          }}
          placeholder="Untitled"
          className="w-full bg-transparent border-0 outline-none text-4xl font-extrabold text-slate-100 placeholder-slate-700 tracking-tight mt-2"
        />
      )}
    </div>
  );
}

export default NotebookHeader;
