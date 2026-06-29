// src/components/Sidebar/SidebarPageItem.tsx
import React from 'react';
import { LuFileText } from 'react-icons/lu';
import type { Page } from '../../state/types';
import DropZone from '../DropZone';

interface SidebarPageItemProps {
  page: Page;
  index: number;
  isLast: boolean;
  isPageActive: boolean;
  isMenuOpen: boolean;
  onPageClick: () => void;
  onMenuToggle: (e: React.MouseEvent) => void;
  onDrop: (activeId: string, targetIndex: number) => void;
}

export const SidebarPageItem: React.FC<SidebarPageItemProps> = ({
  page,
  index,
  isLast,
  isPageActive,
  isMenuOpen,
  onPageClick,
  onMenuToggle,
  onDrop,
}) => {
  return (
    <div className="group relative flex flex-col w-full">
      <DropZone index={index} size="sm" onDropBlock={onDrop} />

      <div className="relative flex items-center w-full min-h-7 my-0.5">
        <button
          onClick={onPageClick}
          className={`flex items-center w-full text-left pl-2 pr-10 py-1 text-xs rounded transition-all duration-150 truncate select-none ${
            isPageActive
              ? 'bg-blue-950/40 text-blue-400 font-medium shadow-sm'
              : 'text-slate-500 hover:bg-slate-900/40 hover:text-slate-300'
          }`}
        >
          <span
            data-drag-handle-for={page.id}
            draggable="true"
            // 🎯 The missing link: package the page ID into the browser's drag payload
            onDragStart={(e) => {
              // 🎯 Pass the numeric array index (as a string string) instead of the page UUID
              e.dataTransfer.setData('text/plain', String(index));
              e.dataTransfer.effectAllowed = 'move';
            }}
            className="flex items-center shrink-0 mr-2 cursor-grab text-slate-600 hover:text-slate-400 active:cursor-grabbing"
          >
            <LuFileText className="w-3.5 h-3.5" />
          </span>
          <span className="truncate pr-2">{page.title}</span>
        </button>

        <div
          className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 items-center justify-center ${
            isMenuOpen ? 'flex' : 'hidden group-hover:flex'
          }`}
        >
          <button
            onClick={onMenuToggle}
            className={`flex items-center justify-center w-4.5 h-4.5 rounded text-xs transition-colors pointer-events-auto ${
              isMenuOpen
                ? 'bg-slate-800 text-slate-300'
                : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
            }`}
          >
            &#8942;
          </button>
        </div>
      </div>

      {isLast && <DropZone index={index + 1} size="sm" onDropBlock={onDrop} />}
    </div>
  );
};
