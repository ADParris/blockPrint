import React from 'react';
import { type GenericKanbanItem, type ProgressState } from '../state/types';
import DropZone from './DropZone';

interface KanbanColumnConfig {
  id: ProgressState; // e.g., 'Pending', 'In Progress', 'Completed'
  title: string;
  color: string;
}

interface KanbanBoardProps<T extends GenericKanbanItem> {
  title: string;
  subtitle: string;
  columns: KanbanColumnConfig[];
  itemsByColumn: (columnId: string) => T[];
  onMoveItem: (
    itemId: string,
    targetColumnId: ProgressState,
    targetIndex: number,
  ) => void;
  renderCard: (item: T) => React.ReactNode;
  onBack: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function KanbanBoard<T extends GenericKanbanItem>({
  title,
  subtitle,
  columns,
  itemsByColumn,
  onMoveItem,
  renderCard,
  onBack,
}: KanbanBoardProps<T>) {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b0f19] p-6 overflow-hidden select-none">
      <div className="mb-6 flex items-start gap-4">
        {/* Elegant, low-profile inline back action */}
        <button
          onClick={onBack}
          className="mt-1 p-2 text-slate-500 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 rounded-lg transition-all flex items-center justify-center shrink-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>

        {/* Text Column moves together smoothly */}
        <div className="flex flex-col min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            {title}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>
        </div>
      </div>

      {/* Kanban Column Grid */}
      <div className="flex-1 grid grid-cols-3 gap-4 h-full overflow-hidden items-stretch">
        {columns.map((col) => {
          const laneItems = itemsByColumn(col.id);

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
                  {laneItems.length}
                </span>
              </div>

              {/* Cards List Scroller Container */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden relative px-2 custom-scrollbar">
                {/* Top-most DropZone */}
                <DropZone
                  index={0}
                  columnId={col.id}
                  size="lg"
                  onDropBlock={(itemId, targetIndex, targetColumnId) => {
                    if (targetColumnId)
                      onMoveItem(itemId, targetColumnId, targetIndex);
                  }}
                />

                {laneItems.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-600 border border-dashed border-slate-800/60 rounded-lg my-2">
                    No items in this column
                  </div>
                ) : (
                  laneItems.map((item, idx) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', item.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                    >
                      {renderCard(item)}

                      <DropZone
                        index={idx + 1}
                        columnId={col.id}
                        size="lg"
                        onDropBlock={(itemId, targetIndex, targetColumnId) => {
                          if (targetColumnId)
                            onMoveItem(itemId, targetColumnId, targetIndex);
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
}
