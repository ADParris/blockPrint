// src/components/Sidebar/SidebarLayoutToggle.tsx
import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useProjectStore } from '../../state/useProjectStore';
import { paths } from '../../utils/routes';

export const SidebarLayoutToggle: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 🎯 1. Read layout targets straight from the active browser address bar parameters
  const { namespace, projectId, pageId } = useParams<{
    namespace: string;
    projectId?: string;
    pageId?: string;
  }>();

  // 🎯 2. Atomic Selector Subscriptions to enforce stable render performance
  const pages = useProjectStore((state) => state.pages);
  const currentUser = useProjectStore((state) => state.currentUser);

  // 3. Resolve if a page layout is actively selected using the current path parameters
  const activePage =
    projectId && pageId && pages[projectId]
      ? pages[projectId].find((p) => p.id === pageId)
      : null;

  // If there's no active page selection context in the URL, keep the view controller hidden
  if (!activePage || !projectId || !pageId) return null;

  const targetNamespace = namespace || currentUser?.name || 'ADParris';

  // 🎯 4. Check the end of the pathname to dynamically highlight the active toggle mode
  const currentPath = location.pathname;
  const isCanvas =
    currentPath.endsWith(`/pages/${pageId}`) || currentPath.endsWith('/canvas');
  const isKanban =
    currentPath.endsWith('/roadmap') || currentPath.endsWith('/kanban');
  const isDocument = !isCanvas && !isKanban; // Fallback to default Document node view

  const handleDocumentClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    navigate(paths.pageDocument(targetNamespace, projectId, pageId));
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    navigate(paths.pageCanvas(targetNamespace, projectId, pageId));
  };

  const handleKanbanClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    navigate(paths.pageKanban(targetNamespace, projectId, pageId), {
      state: { from: 'document' },
    });
  };

  return (
    <div className="mt-auto p-4 border-t border-slate-800 bg-[#0b0f19]">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        Workspace View
      </p>
      <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-lg w-full gap-1">
        {/* Document Mode Toggle */}
        <button
          onClick={handleDocumentClick}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
            isDocument
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          📝 Document
        </button>

        {/* Spatial Canvas Mode Toggle */}
        <button
          onClick={handleCanvasClick}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
            isCanvas
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          🗺️ Canvas
        </button>

        {/* Kanban Board Toggle */}
        <button
          onClick={handleKanbanClick}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
            isKanban
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          📋 Kanban
        </button>
      </div>
    </div>
  );
};
