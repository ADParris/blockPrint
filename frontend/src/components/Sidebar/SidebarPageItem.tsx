// src/components/Sidebar/SidebarPageItem.tsx
import React from 'react';
import { LuEllipsisVertical, LuFileText } from 'react-icons/lu';
import { SidebarElement, type Page } from '../../state/types';
import { useProjectStore } from '../../state/useProjectStore';
import Button from '../Button';

interface SidebarPageItemProps {
  page: Page;
  index: number;
  isPageActive: boolean;
  onPageClick: () => void;
  onMenuToggle: (e: React.MouseEvent) => void;
}

export const SidebarPageItem: React.FC<SidebarPageItemProps> = ({
  page,
  index,
  isPageActive,
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
      <div className="group/outer relative flex items-center w-full min-h-7 my-0.5">
        <Button
          onClick={onPageClick}
          className={`w-full text-left pl-2 pr-10 py-1 text-xs ${
            isPageActive
              ? 'text-fg'
              : 'text-fg/60 hover:text-fg group-hover/outer:text-fg'
          }`}
        >
          <span
            className="cursor-grab active:cursor-grabbing mr-2 shrink-0"
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
          >
            <LuFileText
              className={`w-3.5 h-3.5  ${
                isPageActive
                  ? 'text-accent-blue' // Active
                  : 'text-accent-blue/60 group-hover/button:text-accent-blue group-hover/outer:text-accent-blue' // Inactive
              }`}
            />
          </span>
          {page.title}
        </Button>

        <div
          className={`absolute right-2 flex items-center space-x-1 group-hover/outer:opacity-100 transition-opacity duration-150${isPageActive ? ' opacity-100' : ' opacity-0'}`}
        >
          <Button onClick={onMenuToggle}>
            <LuEllipsisVertical className="w-4 h-4 text-fg/40 group-hover/button:text-fg" />
          </Button>
        </div>
      </div>
    </div>
  );
};
