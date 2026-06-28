// src/components/Headers/PageHeader.tsx
import { useEffect, useRef, useState } from 'react';
import { useImageBlob } from '../hooks/useImageBlob';
import type { Page } from '../state/types'; // 🎯 Updated from Notebook to Page
import { useProjectStore } from '../state/useProjectStore';
import { ImageControls } from './ImageControls';
import Loader from './Loader';

interface PageHeaderProps {
  page: Page; // 🎯 Renamed property
}

function PageHeader({ page }: PageHeaderProps) {
  // 🎯 Updated selector to pull the clean, multi-project action name
  const { updatePageHeader, setImageCacheUrl } = useProjectStore(
    (state) => state,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUserAddingTitle, setIsUserAddingTitle] = useState(false);
  const [isDecoded, setIsDecoded] = useState(false);

  // 1. Core State derived from page props
  const pageId = page?.id || '';
  const coverImageId = page?.coverImage || '';
  const hasCover = !!page?.coverImage && page?.coverImage !== 'PENDING_UPLOAD';
  const hasTitleIntent =
    page?.headerTitle !== undefined && page?.headerTitle !== 'Untitled Page';

  // 2. Pass the fallback safe strings down into your hook
  const { previewUrl, isAssetLoading, processFile } = useImageBlob(
    pageId,
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
      // 1. Evict old object URL from global cache instantly
      setImageCacheUrl(page.id, '');

      // 2. Write new binary file over old one in IndexedDB
      const success = await processFile(file);
      if (success) {
        // 3. Force the state update
        updatePageHeader(page.id, { coverImage: page.id });
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
                updatePageHeader(page.id, { headerTitle: '' });
              }}
              className="text-xs text-slate-400 hover:text-indigo-400 font-medium transition-colors cursor-pointer"
            >
              ✍️ Add title
            </button>
          )}
        </div>
      )}

      {/* 2. Pure Banner Layout Layer */}
      {hasCover && (
        <div className="relative group/cover w-full h-48 overflow-hidden rounded-xl border border-slate-800/30 bg-zinc-900/40 shadow-inner">
          {/* SKELETON LOADER LAYER */}
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
              setImageCacheUrl(page.id, '');
              updatePageHeader(page.id, { coverImage: undefined });
            }}
            onSwap={async (file) => {
              setImageCacheUrl(page.id, '');
              const success = await processFile(file);
              if (success) {
                updatePageHeader(page.id, { coverImage: page.id });
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
          value={page.headerTitle}
          onChange={(e) =>
            updatePageHeader(page.id, { headerTitle: e.target.value })
          }
          onKeyDown={(e) => {
            if (e.key === 'Backspace') {
              const input = e.currentTarget;
              if (input.selectionStart !== input.selectionEnd) return;
              if (
                (input.selectionStart === 0 && input.selectionEnd === 0) ||
                !page.headerTitle ||
                page.headerTitle.trim() === ''
              ) {
                e.preventDefault();
                updatePageHeader(page.id, {
                  headerTitle: 'Untitled Page',
                });
              }
            }
          }}
          onBlur={() => {
            if (!page.headerTitle || page.headerTitle.trim() === '') {
              updatePageHeader(page.id, {
                headerTitle: 'Untitled Page',
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

export default PageHeader;
