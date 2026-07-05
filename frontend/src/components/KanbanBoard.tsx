// src/components/KanbanBoard.tsx
import React from 'react';
import {
  type GenericKanbanItem,
  type ProgressState,
  BaseElement,
} from '../state/types';
import DropZone from './DropZone';

interface KanbanColumnConfig {
  id: ProgressState;
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
  elementType: typeof BaseElement.Page | typeof BaseElement.Block;
}

export function KanbanBoard<T extends GenericKanbanItem>({
  title,
  subtitle,
  columns,
  itemsByColumn,
  onMoveItem,
  renderCard,
  onBack,
  elementType,
}: KanbanBoardProps<T>) {
  // 🎯 Track which specific column lane currently has an active drag hover over it
  const [activeHoveredColumnId, setActiveHoveredColumnId] =
    React.useState<ProgressState | null>(null);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b0f19] py-6 overflow-hidden select-none">
      {/* Header section... */}
      <div className="mb-6 ml-6 flex items-center gap-4">
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
        <div className="flex flex-col min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            {title}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>
        </div>
      </div>

      {/* Kanban Column Grid Container */}
      <div className="flex-1 flex justify-center gap-6 h-full overflow-hidden items-stretch mx-auto w-full max-w-7xl px-6">
        {columns.map((col) => {
          const laneItems = itemsByColumn(col.id);
          const isLaneHovered = activeHoveredColumnId === col.id;

          return (
            <div
              key={col.id}
              onDragEnter={(e) => {
                e.preventDefault();
                setActiveHoveredColumnId(col.id);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                const target = e.relatedTarget as HTMLElement;
                if (!target || !e.currentTarget.contains(target)) {
                  setActiveHoveredColumnId(null);
                }
              }}
              onDrop={() => setActiveHoveredColumnId(null)}
              className={`relative flex flex-col border border-slate-800 border-t-2 ${col.color} rounded-xl w-80 max-w-80 h-full bg-slate-950/20 transition-colors duration-200 ${
                isLaneHovered ? 'bg-slate-900/10 border-slate-700' : ''
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-2 p-3 border-b border-slate-800 shrink-0">
                <span className="text-sm font-semibold tracking-wide text-slate-300">
                  {col.title}
                </span>
                <span className="text-xs font-mono bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                  {laneItems.length}
                </span>
              </div>
              {/* Cards List Stack */}
              <div className="flex flex-col flex-1 items-center overflow-y-auto overflow-x-hidden p-2 custom-scrollbar w-full gap-3">
                {laneItems.length === 0 ? (
                  <>
                    <DropZone
                      index={0}
                      acceptedType={elementType}
                      projectId={null}
                      columnId={col.id}
                      onKanbanDrop={onMoveItem}
                      size={isLaneHovered ? 'md' : 'sm'}
                    />
                    <div className="w-full text-center py-8 text-xs text-slate-600 border border-dashed border-slate-800/60 rounded-lg">
                      No items in this column
                    </div>
                  </>
                ) : (
                  laneItems.map((item, index) => (
                    <React.Fragment key={item.id}>
                      <DropZone
                        index={index}
                        acceptedType={elementType}
                        projectId={null}
                        columnId={col.id}
                        onKanbanDrop={onMoveItem}
                        size={isLaneHovered ? 'md' : 'sm'}
                        className={`w-full transition-all duration-200 ease-in-out relative flex items-center justify-center rounded outline-none z-10 ${
                          isLaneHovered
                            ? 'h-10 my-1 pointer-events-auto bg-transparent' /* Massive 40px layout expansion */
                            : 'h-2 my-0 pointer-events-auto bg-transparent' /* Low-profile resting state */
                        }`}
                      />

                      <div
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', item.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragStartCapture={() =>
                          setActiveHoveredColumnId(col.id)
                        }
                        /* 🎯 FIX 3: Ensure the card wrapper doesn't try to stretch out to full-width */
                        className="w-full flex justify-center cursor-grab active:cursor-grabbing"
                      >
                        {renderCard(item)}
                      </div>

                      {index === laneItems.length - 1 && (
                        <DropZone
                          index={index + 1}
                          acceptedType={elementType}
                          projectId={null}
                          columnId={col.id}
                          onKanbanDrop={onMoveItem}
                          size={isLaneHovered ? 'md' : 'sm'}
                        />
                      )}
                    </React.Fragment>
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

export default KanbanBoard;
