import { del, get, set } from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';

// 1. Your existing Zustand text sync store
export const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

// 2. NEW: Save the raw binary image Blob directly to IndexedDB
export const saveImageBlob = async (id: string, blob: Blob): Promise<void> => {
  // idb-keyval handles storing binary Blobs natively with zero config!
  await set(id, blob);
};

// 3. NEW: Fetch the Blob and turn it into a live temporary view URL for your <img> tag
export const loadImageBlob = async (id: string): Promise<string | null> => {
  const blob = await get<Blob>(id);
  if (!blob) return null;

  // Creates a fast, memory-mapped string pointer to the raw binary data
  return URL.createObjectURL(blob);
};
