// src/state/imageSlice.ts
import type { StoreSlice } from './types';

export interface ImageSlice {
  setImageCacheUrl: (blockId: string, url: string) => void;
  clearImageCache: () => void;
}

export const createImageSlice: StoreSlice<ImageSlice> = (set) => ({
  setImageCacheUrl: (blockId, url) =>
    set((state) => {
      const newCache = { ...state.imageCache };

      // 🎯 If an empty string is passed, cleanly evict the key from the cache map
      if (!url) {
        delete newCache[blockId];
      } else {
        newCache[blockId] = url;
      }

      return { imageCache: newCache };
    }),

  clearImageCache: () => {
    set((state) => {
      Object.values(state.imageCache).forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (err) {
          console.error('Failed to revoke image object URL:', err);
        }
      });
      return { imageCache: {} };
    });
  },
});
