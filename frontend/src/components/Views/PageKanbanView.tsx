import React from 'react';
import { WorkspaceViewMode, type ProgressState } from '../../state/types';
import { useProjectStore } from '../../state/useProjectStore';
import Card from '../Card';
import DropZone from '../DropZone';

const COLUMNS: { id: ProgressState; title: string; color: string }[] = [
  { id: 'Pending', title: 'Pending', color: 'border-t-slate-500' },
  { id: 'InProgress', title: 'In Progress', color: 'border-t-blue-500' },
  { id: 'Completed', title: 'Completed', color: 'border-t-emerald-500' },
];

export const PageKanbanView: React.FC = () => {
  // 🎯 Connect up our new page-level selectors and actions
  const getProjectPages = useProjectStore((state) => state.getProjectPages);
  const movePageInKanban = useProjectStore((state) => state.movePageInKanban);
  const setWorkspaceViewMode = useProjectStore(
    (state) => state.setWorkspaceViewMode,
  );
  const setActivePageId = useProjectStore((state) => state.setActivePageId);

  const handleClick = (pageId: string) => {
    setActivePageId(pageId);
    setWorkspaceViewMode(WorkspaceViewMode.PageDocument);
  };

  const handleMoveCard = (
    pageId: string,
    targetColumnId: ProgressState,
    targetIndex: number,
  ) => {
    movePageInKanban(pageId, targetColumnId, targetIndex);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b0f19] p-6 overflow-hidden select-none">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-slate-100">
          Project Roadmap
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Track and organize documents and features across production pipelines.
        </p>
      </div>

      {/* Kanban Column Grid */}
      <div className="flex-1 grid grid-cols-3 gap-4 h-full overflow-hidden items-stretch">
        {COLUMNS.map((col) => {
          // 🎯 Single clean store slice execution per column lane
          const lanePages = getProjectPages(col.id);

          return (
            <div
              key={col.id}
              className={`relative flex flex-col border border-slate-800 border-t-2 ${col.color} rounded-xl p-4 h-full bg-slate-950/20`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                <span className="text-sm font-semibold tracking-wide text-slate-300">
                  {col.title}
                </span>
                <span className="text-xs font-mono bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                  {lanePages.length}
                </span>
              </div>

              {/* Cards List Scroller Container */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden relative px-2 custom-scrollbar">
                {/* Top-most DropZone */}
                <DropZone
                  index={0}
                  columnId={col.id}
                  size="lg"
                  onDropBlock={(pageId, targetIndex, targetColumnId) => {
                    if (targetColumnId)
                      handleMoveCard(pageId, targetColumnId, targetIndex);
                  }}
                />

                {lanePages.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-600 border border-dashed border-slate-800/60 rounded-lg my-2">
                    No pages in this column
                  </div>
                ) : (
                  lanePages.map((page, idx) => (
                    <div
                      key={page.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', page.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                    >
                      <Card onClick={() => handleClick(page.id)}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="w-full min-w-0">
                            <p className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
                              📄 {page.title || 'Untitled Page'}
                            </p>

                            {/* Internal Metadata Readout */}
                            <p className="text-[10px] text-slate-500 mt-1 tracking-wide">
                              Contains {page.blocks?.length || 0} production
                              elements
                            </p>
                          </div>
                        </div>
                      </Card>

                      <DropZone
                        index={idx + 1}
                        columnId={col.id}
                        size="lg"
                        onDropBlock={(pageId, targetIndex, targetColumnId) => {
                          if (targetColumnId)
                            handleMoveCard(pageId, targetColumnId, targetIndex);
                        }}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
