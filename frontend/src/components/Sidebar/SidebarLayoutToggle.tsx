// src/components/SidebarLayoutToggle.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkspaceViewMode } from '../../state/types';
import { useProjectStore } from '../../state/useProjectStore';
import { paths } from '../../utils/routes';

export const SidebarLayoutToggle: React.FC = () => {
  // 🎯 Fix: Select properties individually to prevent object reference recreation loops
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const activePageId = useProjectStore((state) => state.activePageId);
  const namespace = useProjectStore(
    (state) => state.groups?.group_design_team?.slug || 'ADParris',
  );
  const pages = useProjectStore((state) => state.pages);
  const activeViewMode = useProjectStore((state) => state.activeViewMode);
  const setWorkspaceViewMode = useProjectStore(
    (state) => state.setWorkspaceViewMode,
  );
  const navigate = useNavigate();

  // Safely grab the currently active page object
  const activePage =
    activeProjectId && activePageId && pages[activeProjectId]
      ? pages[activeProjectId].find((p) => p.id === activePageId)
      : null;

  const handleDocumentClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setWorkspaceViewMode(WorkspaceViewMode.PageDocument);
    navigate(paths.pageDocument(namespace, activeProjectId!, activePageId!));
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setWorkspaceViewMode(WorkspaceViewMode.PageCanvas);
    navigate(paths.pageCanvas(namespace, activeProjectId!, activePageId!));
  };

  const handleKanbanClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    if (!activeProjectId || !activePageId) {
      console.warn('Missing project or page context in store!');
      return;
    }
    setWorkspaceViewMode(WorkspaceViewMode.PageKanban);
    navigate(paths.pageRoadmap(namespace, activeProjectId, activePageId), {
      state: { from: 'document' }, // Stamp it so the back button knows we came from the editor!
    });
  };

  // If there's no active page selection, keep the view controller hidden
  if (!activePage) return null;

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
            activeViewMode === WorkspaceViewMode.PageDocument
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
            activeViewMode === WorkspaceViewMode.PageCanvas
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
            activeViewMode === WorkspaceViewMode.PageKanban
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
