import axios from 'axios';
import type { Page, Project, UserProjectOrders } from '../state/types';

// 1. Define the shape of a single user's backed-up workspace data
export interface UserWorkspaceData {
  projects: Project[];
  pages: Record<string, Page[]>;
  userSortOrders: Record<string, UserProjectOrders>;
}

// 2. Define the full payload shape (a dictionary of user IDs to their data)
export type SaveWorkspacePayload = Record<string, UserWorkspaceData>;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const projectApi = {
  /**
   * Hits GET /api/load to retrieve the global master workspace object
   */
  loadWorkspace: async (): Promise<SaveWorkspacePayload> => {
    const response = await api.get<SaveWorkspacePayload>('/load');
    return response.data;
  },

  /**
   * Hits POST /api/save to write the master multi-user dictionary to disk
   */
  saveWorkspace: async (
    payload: SaveWorkspacePayload,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/save', payload);
    return response.data;
  },
};
