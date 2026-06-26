import { useEffect, useState } from 'react';
import { loadImageBlob, saveImageBlob } from '../api/idbStorage';
import { useCanvasStore } from '../state/useCanvasStore';

export function useImageBlob(storageKey: string, content: string) {
  const imageCache = useCanvasStore((state) => state.imageCache);
  const setImageCacheUrl = useCanvasStore((state) => state.setImageCacheUrl);

  // 1. Instantly determine expected URL during render pass
  const currentExpectedUrl = content ? (imageCache[storageKey] ?? null) : null;
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentExpectedUrl,
  );

  // 2. Sync state when content identifier switches
  const [prevContent, setPrevContent] = useState(content);
  if (content !== prevContent) {
    setPrevContent(content);
    setPreviewUrl(currentExpectedUrl);
  }

  // 3. Asynchronous IndexedDB loader loop
  useEffect(() => {
    if (content && !imageCache[storageKey]) {
      let isMounted = true;

      loadImageBlob(content)
        .then((url) => {
          if (!isMounted) {
            if (url) URL.revokeObjectURL(url);
            return;
          }
          if (url) {
            setImageCacheUrl(storageKey, url);
            setPreviewUrl(url);
          }
        })
        .catch((err) => {
          console.error('Error reading image blob:', err);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [content, storageKey, imageCache, setImageCacheUrl]);

  /**
   * Self-contained worker to process file writes to IndexedDB
   */
  const processFile = async (file: File): Promise<boolean> => {
    if (file && file.type.startsWith('image/')) {
      try {
        await saveImageBlob(storageKey, file);
        return true;
      } catch (err) {
        console.error('Failed to store local binary image:', err);
        return false;
      }
    }
    return false;
  };

  return {
    previewUrl: content ? previewUrl : null,
    isAssetLoading: content && !previewUrl,
    processFile,
  };
}
