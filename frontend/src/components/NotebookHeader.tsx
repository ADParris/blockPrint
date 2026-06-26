import { useEffect, useRef, useState } from 'react';
import { useImageBlob } from '../hooks/useImageBlob';
import type { Notebook } from '../state/types';
import { useCanvasStore } from '../state/useCanvasStore';
import { ImageControls } from './ImageControls';
import Loader from './Loader';

interface NotebookHeaderProps {
  notebook: Notebook;
}

function NotebookHeader({ notebook }: NotebookHeaderProps) {
  const { updateNotebookHeader, setImageCacheUrl } = useCanvasStore(
    (state) => state,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUserAddingTitle, setIsUserAddingTitle] = useState(false);
  const [isDecoded, setIsDecoded] = useState(false);

  // 1. Core State derived from props
  const coverImageId = notebook.coverImage || '';
  const hasCover =
    !!notebook.coverImage && notebook.coverImage !== 'PENDING_UPLOAD';
  const hasTitleIntent =
    notebook.headerTitle !== undefined &&
    notebook.headerTitle !== 'Untitled Notebook';

  // 2. Consume our new, unified logic hook using the notebook's ID as the storage key
  const { previewUrl, isAssetLoading, processFile } = useImageBlob(
    notebook.id,
    coverImageId,
  );

  // 🎯 Render-pass sync: Reset decode state when the preview URL changes
  const [prevUrl, setPrevUrl] = useState(previewUrl);
  if (previewUrl !== prevUrl) {
    setPrevUrl(previewUrl);
    setIsDecoded(false);
  }

  useEffect(() => {
    if (hasTitleIntent && isUserAddingTitle && inputRef.current) {
      inputRef.current.focus();
      setIsUserAddingTitle(false);
    }
  }, [hasTitleIntent, isUserAddingTitle]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 1. Evict the old object URL from the global Zustand cache instantly
      setImageCacheUrl(notebook.id, '');

      // 2. Write the new binary file over the old one in IndexedDB
      const success = await processFile(file);
      if (success) {
        // 3. Force the state update. Even if the string matches,
        // the hook will now see that imageCache[notebook.id] is empty and re-fetch!
        updateNotebookHeader(notebook.id, { coverImage: notebook.id });
      }
      e.target.value = '';
    }
  };

  return (
    <div className="group header-group relative w-full mb-8 min-h-10">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* 1. Hover Action Context Bar */}
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

      {/* 2. Pure Banner Layout Layer (No more hijacked ImageBlock) */}
      {hasCover && (
        <div className="relative group/cover w-full h-48 overflow-hidden rounded-xl border border-slate-800/30 bg-zinc-900/40 shadow-inner">
          {/* 📡 SKELETON LOADER LAYER */}
          <div
            className={`absolute inset-0 z-30 w-full h-full bg-slate-800/20 flex items-center justify-center transition-opacity duration-200 pointer-events-none ${
              isAssetLoading || !isDecoded ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Loader label="Loading cover..." size="md" />
          </div>

          {/* 🖼️ ACTIVE BANNER ELEMENT */}
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Cover banner"
              onLoad={() => setIsDecoded(true)}
              onError={() => setIsDecoded(true)}
              className={`w-full h-full object-cover transition-opacity duration-300 ease-out ${
                isDecoded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}

          {/* Overlaid Banner Controls */}
          <ImageControls
            onRemove={() => {
              setImageCacheUrl(notebook.id, '');
              updateNotebookHeader(notebook.id, { coverImage: undefined });
            }}
            onSwap={async (file) => {
              setImageCacheUrl(notebook.id, '');
              const success = await processFile(file);
              if (success) {
                updateNotebookHeader(notebook.id, { coverImage: notebook.id });
              }
            }}
          />
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
              if (
                (input.selectionStart === 0 && input.selectionEnd === 0) ||
                !notebook.headerTitle ||
                notebook.headerTitle.trim() === ''
              ) {
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
