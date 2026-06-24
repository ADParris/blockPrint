import React, { useEffect, useState } from 'react';
import { loadImageBlob, saveImageBlob } from '../api/idbStorage';

interface ImageBlockProps {
  blockId: string;
  content: string;
  onContentChange: (id: string, content: string) => void;
  variant?: 'block' | 'cover';
}

function useImageBlob(content: string) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prevContent, setPrevContent] = useState(content);

  if (content !== prevContent) {
    setPrevContent(content);
    if (!content) {
      setPreviewUrl(null);
    }
  }

  useEffect(() => {
    if (!content) return;

    let isMounted = true;
    let localUrl: string | null = null;

    loadImageBlob(content)
      .then((url) => {
        if (!isMounted) {
          if (url) URL.revokeObjectURL(url);
          return;
        }

        if (url) {
          localUrl = url;
          setPreviewUrl(url);
        }
      })
      .catch((err) => {
        console.error('Error reading image blob:', err);
      });

    return () => {
      isMounted = false;
      if (localUrl) {
        URL.revokeObjectURL(localUrl);
      }
    };
  }, [content]);

  return content ? previewUrl : null;
}

const ImageBlock: React.FC<ImageBlockProps> = ({
  blockId,
  content,
  onContentChange,
  variant = 'block',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const previewUrl = useImageBlob(content);

  const processFile = async (file: File) => {
    if (file && file.type.startsWith('image/')) {
      try {
        await saveImageBlob(blockId, file);
        onContentChange(blockId, blockId);
      } catch (err) {
        console.error('Failed to store local binary image:', err);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const isCover = variant === 'cover';

  // If it's a cover image and has no content yet, return null.
  // NotebookHeader will handle rendering its own "Add cover" action trigger.
  if (isCover && !previewUrl) return null;

  return (
    <div className={`w-full ${isCover ? '' : 'my-4'}`}>
      {previewUrl ? (
        <div
          className={`relative overflow-hidden w-full ${
            isCover
              ? 'h-48' // NotebookHeader handles the outer borders, rounding, and group selectors
              : 'relative group border border-slate-800/60 bg-[#1e1e1e] shadow-xl min-h-32 max-h-100 rounded-lg flex items-center justify-center p-4'
          }`}
        >
          <img
            src={previewUrl}
            alt={isCover ? 'Cover banner' : 'Canvas media content'}
            className={`block ${
              isCover
                ? 'w-full h-full object-cover'
                : 'max-w-full max-h-92 object-contain'
            }`}
          />

          {/* Only render the deletion overlay if it's a standard document/canvas block! */}
          {!isCover && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
              <button
                onClick={() => onContentChange(blockId, '')}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-sm font-medium transition-colors shadow-lg cursor-pointer"
              >
                Remove Image
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Standard Inline Block Dropzone */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={(e) => {
            e.stopPropagation();
            document.getElementById(`file-upload-${blockId}`)?.click();
          }}
          className={`w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-indigo-500 bg-indigo-500/5'
              : 'border-slate-800 hover:border-slate-700 bg-slate-900/10'
          } p-8 min-h-32`}
        >
          <input
            id={`file-upload-${blockId}`}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <span className="text-sm text-slate-400 font-medium">
            Drag & drop an image here, or click to upload
          </span>
        </div>
      )}
    </div>
  );
};

export default ImageBlock;
