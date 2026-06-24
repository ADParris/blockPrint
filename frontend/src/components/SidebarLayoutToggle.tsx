import React from 'react';
import { useCanvasStore } from '../state/useCanvasStore';
import { LayoutMode } from '../state/types';

export const SidebarLayoutToggle: React.FC = () => {
  const activeNotebookId = useCanvasStore((state) => state.activeNotebookId);
  const notebooks = useCanvasStore((state) => state.notebooks);
  const setLayoutMode = useCanvasStore((state) => state.setLayoutMode);

  const activeNotebook = notebooks.find((nb) => nb.id === activeNotebookId);

  // If there's no active notebook selection, keep the footer clean
  if (!activeNotebook) return null;

  const currentMode = activeNotebook.layoutMode || LayoutMode.DocumentCanvas;

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
