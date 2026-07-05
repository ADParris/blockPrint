// src/components/Sidebar/SidebarPageItem.tsx
import React from 'react';
import { LuFileText } from 'react-icons/lu';
import { SidebarElement, type Page } from '../../state/types';
import { useProjectStore } from '../../state/useProjectStore';

interface SidebarPageItemProps {
  page: Page;
  index: number;
  isLast: boolean;
  isPageActive: boolean;
  isMenuOpen: boolean;
  onPageClick: () => void;
  onMenuToggle: (e: React.MouseEvent) => void;
}

export const SidebarPageItem: React.FC<SidebarPageItemProps> = ({
  page,
  index,
  isPageActive,
  isMenuOpen,
  onPageClick,
  onMenuToggle,
}) => {
  const setActiveSidebarDrag = useProjectStore(
    (state) => state.setActiveSidebarDrag,
  );
  return (
    // 🎯 Use data-sidebar-item-id attribute on the outer row for accurate bounds matching
    <div
      data-sidebar-item-id={String(index)}
      className="group relative flex flex-col w-full"
    >
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
            onDragStart={(e) => {
              e.stopPropagation(); // Stop bubbling up to the Project drag handlers!
              e.dataTransfer.setData('text/plain', String(index));
              // 🎯 Set explicit mime-type isolation token for pages
              e.dataTransfer.setData('application/x-page', String(index));
              e.dataTransfer.effectAllowed = 'move';
              setActiveSidebarDrag(SidebarElement.Page, null); // Set the active drag object type in the store
            }}
            onDragEnd={() => {
              setActiveSidebarDrag(null, null); // Reset the active drag object type and scope in the store
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
    </div>
  );
};
