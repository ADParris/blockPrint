import { useEffect, useRef, useState } from 'react'; // 🎯 Track explicit action state
import { saveImageBlob } from '../api/idbStorage';
import type { Notebook } from '../state/types';
import { useCanvasStore } from '../state/useCanvasStore';
import ImageBlock from './ImageBlock';

interface NotebookHeaderProps {
  notebook: Notebook;
}

function NotebookHeader({ notebook }: NotebookHeaderProps) {
  const [coverVersion, setCoverVersion] = useState(0);
  const { updateNotebookHeader } = useCanvasStore((state) => state);
  const inputRef = useRef<HTMLInputElement>(null);

  // 🎯 Hidden file input reference for swapping images cleanly
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUserAddingTitle, setIsUserAddingTitle] = useState(false);

  // 🎯 Re-added to satisfy the callback contract for ImageBlock
  const handleCoverChange = (_id: string, newContent: string) => {
    updateNotebookHeader(notebook.id, { coverImage: newContent || undefined });
  };

  const hasCover =
    !!notebook.coverImage && notebook.coverImage !== 'PENDING_UPLOAD';
  const hasTitleIntent =
    notebook.headerTitle !== undefined &&
    notebook.headerTitle !== 'Untitled Notebook';

  useEffect(() => {
    if (hasTitleIntent && isUserAddingTitle && inputRef.current) {
      inputRef.current.focus();
      setIsUserAddingTitle(false);
    }
  }, [hasTitleIntent, isUserAddingTitle]);

  // Triggered when a file is selected for a swap or new upload via the hidden input
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        await saveImageBlob(notebook.id, file);

        // 1. Update the Zustand store
        updateNotebookHeader(notebook.id, { coverImage: notebook.id });

        // 2. 🔥 Call it here! This increments the state and forces the re-render.
        setCoverVersion((prev) => prev + 1);
      } catch (err) {
        console.error('Failed to store local banner binary:', err);
      }
    }
  };

  return (
    <div className="group header-group relative w-full mb-8 min-h-10">
      {/* Hidden native input for triggering file browsing */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* 1. Hover Action Context Bar (For adding items when empty) */}
      {(!hasCover || !hasTitleIntent) && (
        <div className="absolute -top-6 left-0 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out z-10 select-none bg-[#0b0f19]/80 backdrop-blur-sm px-2 py-1 rounded border border-slate-800/40 shadow-md">
          {!hasCover && (
            <button
              onClick={() => fileInputRef.current?.click()}
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
                setIsUserAddingTitle(true);
                updateNotebookHeader(notebook.id, { headerTitle: '' });
              }}
              className="text-xs text-slate-400 hover:text-indigo-400 font-medium transition-colors cursor-pointer"
            >
              ✍️ Add title
            </button>
          )}
        </div>
      )}

      {/* 2. Cover Image Layer with Parent-Level Hover Controls */}
      {hasCover && (
        <div className="relative group/cover w-full h-48 overflow-hidden rounded-xl border border-slate-800/30 shadow-inner">
          <ImageBlock
            key={`${notebook.id}-v${coverVersion}`} // 🎯 Guarantees a fresh mount on every single swap!
            blockId={notebook.id}
            content={notebook.coverImage || ''}
            onContentChange={handleCoverChange}
            variant="cover"
          />

          {/* Controls overlaid elegantly on top */}
          <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover/cover:opacity-100 transition-opacity duration-150 ease-out z-10">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 text-xs font-semibold text-slate-300 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-sm rounded border border-slate-700/50 transition-all cursor-pointer shadow-sm"
            >
              🔄 Swap Cover
            </button>
            <button
              onClick={() =>
                updateNotebookHeader(notebook.id, { coverImage: undefined })
              }
              className="px-2.5 py-1 text-xs font-semibold text-red-300 bg-red-950/80 hover:bg-red-900/90 backdrop-blur-sm rounded border border-red-900/40 transition-all cursor-pointer shadow-sm"
            >
              🗑️ Remove
            </button>
          </div>
        </div>
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
              if (input.selectionStart !== input.selectionEnd) return;

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
          className="w-full bg-transparent border-0 outline-none text-4xl font-extrabold text-slate-100 placeholder-slate-700 tracking-tight mt-4"
        />
      )}
    </div>
  );
}

export default NotebookHeader;
