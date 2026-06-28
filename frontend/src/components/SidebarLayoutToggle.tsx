// src/components/SidebarLayoutToggle.tsx
import React from 'react';
import { LayoutMode } from '../state/types';
import { useProjectStore } from '../state/useProjectStore';

export const SidebarLayoutToggle: React.FC = () => {
  const { activeProjectId, activePageId, pages, setLayoutMode } =
    useProjectStore((state) => state);

  // Safely grab the currently active page object
  const activePage =
    activeProjectId && activePageId && pages[activeProjectId]
      ? pages[activeProjectId].find((p) => p.id === activePageId)
      : null;

  // If there's no active page selection, keep the footer clean
  if (!activePage) return null;

  const currentMode = activePage.layoutMode || LayoutMode.DocumentCanvas;

  return (
    <div className="mt-auto p-4 border-t border-slate-800 bg-[#0b0f19]">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        Workspace View
      </p>
      <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-lg w-full">
        {/* Document Mode Toggle */}
        <button
          onClick={() => setLayoutMode(LayoutMode.DocumentCanvas)}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${
            currentMode === LayoutMode.DocumentCanvas
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          📝 Document
        </button>

        {/* Spatial Canvas Mode Toggle */}
        <button
          onClick={() => setLayoutMode(LayoutMode.SpatialCanvas)}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${
            currentMode === LayoutMode.SpatialCanvas
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          🗺️ Canvas
        </button>
      </div>
    </div>
  );
};
