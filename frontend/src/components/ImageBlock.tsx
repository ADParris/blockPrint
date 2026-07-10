import React, { useRef, useState } from 'react';
import { deleteImageBlob } from '../api/idbStorage';
import { useImageBlob } from '../hooks/useImageBlob'; // Adjust this path to wherever you saved it!
import { useProjectStore } from '../state/useProjectStore';
import { ImageControls } from './ImageControls';
import Loader from './Loader';

interface ImageBlockProps {
  blockId: string;
  content: string;
  onContentChange: (content: string) => void;
}

const ImageBlock: React.FC<ImageBlockProps> = ({
  blockId,
  content,
  onContentChange,
}) => {
  const setImageCacheUrl = useProjectStore((state) => state.setImageCacheUrl);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Consume our new unified hook
  const { previewUrl, isAssetLoading, processFile } = useImageBlob(
    blockId,
    content,
  );

  // 2. Local decode state for smooth fade-in
  const [isDecoded, setIsDecoded] = useState(false);

  // 🎯 Render-pass sync: Reset decode flag when the URL changes
  const [prevUrl, setPrevUrl] = useState(previewUrl);
  if (previewUrl !== prevUrl) {
    setPrevUrl(previewUrl);
    setIsDecoded(false);
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const success = await processFile(file);
      if (success) {
        onContentChange(blockId);
      }
      e.target.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const success = await processFile(file);
      if (success) {
        onContentChange(blockId);
      }
    }
  };

  return (
    <div className="w-full my-4">
      {content ? (
        <div className="relative group border border-line shadow-xl h-64 rounded-lg flex items-center justify-center overflow-hidden">
          {/* 🎨 Opaque Canvas Base Layer */}
          <div className="absolute inset-0 z-0 bg-surface" />

          {/* 📡 SKELETON LOADER LAYER */}
          <div
            className={`absolute inset-0 z-30 w-full h-full bg-surface/20 flex items-center justify-center transition-opacity duration-200 pointer-events-none ${
              isAssetLoading || !isDecoded ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Loader label="Loading asset..." size="md" />
          </div>

          {/* 🖼️ ACTIVE ASSET LAYER */}
          {previewUrl && (
            <div
              key={previewUrl}
              className="absolute inset-0 w-full h-full flex items-center justify-center"
            >
              {/* 🔮 Background Ambient Blur Layer */}
              <img
                src={previewUrl}
                alt=""
                className={`absolute inset-0 z-10 w-full h-full object-cover blur-sm brightness-175 saturate-150 select-none scale-135 pointer-events-none transition-opacity duration-300 ${
                  isDecoded ? 'opacity-50' : 'opacity-0'
                }`}
              />

              {/* 🖼️ Crisp Main Foreground Image */}
              <img
                src={previewUrl}
                alt="Canvas media content"
                onLoad={() => setIsDecoded(true)}
                onError={() => setIsDecoded(true)}
                className={`relative z-20 block transition-opacity duration-300 ease-out max-w-[96%] max-h-[96%] object-contain rounded shadow-md ${
                  isDecoded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </div>
          )}

          {/* 🗑️ INLINE CONTEXT CONTROLS */}
          {isDecoded && (
            <ImageControls
              onRemove={async () => {
                await deleteImageBlob(blockId);
                setImageCacheUrl(blockId, '');
                onContentChange('');
              }}
              onSwap={async (file) => {
                setImageCacheUrl(blockId, ''); // Clear cache line instantly for the swap
                const success = await processFile(file);
                if (success) {
                  onContentChange(blockId);
                }
              }}
            />
          )}
        </div>
      ) : (
        /* 📥 DROPZONE INTERFACE */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          className={`w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-fg-blue bg-fg-blue/5'
              : 'border-line hover:border-line/20 bg-surface/10'
          } p-8 min-h-32`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <span className="text-sm text-fg-muted font-medium">
            Drag & drop an image here, or click to upload
          </span>
        </div>
      )}
    </div>
  );
};

export default ImageBlock;
