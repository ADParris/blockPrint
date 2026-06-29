import React from 'react';
import { LuFolder, LuPlus } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { WorkspaceViewMode, type Page, type Project } from '../../state/types';
import SortableList from '../SortableList';
import { SidebarPageItem } from './SidebarPageItem';

interface SidebarProjectItemProps {
  project: Project;
  targetNamespace: string;
  activeProjectId: string | null;
  activePageId: string | null;
  activeViewMode: string;
  sortedPages: Page[];
  isMenuOpen: boolean;
  onCreatePageClick: (e: React.MouseEvent) => void;
  onMenuToggle: (e: React.MouseEvent) => void;
  onPageMenuToggle: (e: React.MouseEvent, pageId: string) => void;
  onReorderPages: (activeIndex: number, overIndex: number) => void;
  activeMenuTargetId?: string;
  activeMenuType?: string;
}

export const SidebarProjectItem: React.FC<SidebarProjectItemProps> = ({
  project,
  targetNamespace,
  activeProjectId,
  activePageId,
  activeViewMode,
  sortedPages,
  isMenuOpen,
  onCreatePageClick,
  onMenuToggle,
  onPageMenuToggle,
  onReorderPages,
  activeMenuTargetId,
  activeMenuType,
}) => {
  const navigate = useNavigate();
  const isProjectActive = project.id === activeProjectId;
  const isDashboardActive =
    isProjectActive && activeViewMode === WorkspaceViewMode.ProjectDashboard;

  return (
    <div className="space-y-1">
      <div className="group relative flex items-center w-full">
        <button
          onClick={() => {
            // 🎯 Fixed: Now properly using targetNamespace for dynamic routing!
            navigate(`/${targetNamespace}/projects/${project.id}`);
          }}
          className={`flex items-center w-full text-left pl-2 pr-14 py-1.5 text-sm rounded-md transition-all duration-150 truncate ${
            isDashboardActive
              ? 'bg-slate-900/80 text-slate-100 font-semibold shadow-sm'
              : isProjectActive
                ? 'text-slate-300 font-medium hover:bg-slate-900/10'
                : 'text-slate-400 hover:bg-slate-900/20 hover:text-slate-200'
          }`}
        >
          <span
            draggable="true"
            onDragStart={(e) => {
              e.stopPropagation(); // Prevents page-level bubble conflicts
              e.dataTransfer.setData('text/plain', project.id);
              e.dataTransfer.effectAllowed = 'move';
            }}
            className="cursor-grab active:cursor-grabbing mr-2 shrink-0"
          >
            <LuFolder
              className={`w-4 h-4 mr-2 shrink-0 ${isProjectActive ? 'text-blue-400' : 'text-slate-500'}`}
            />
          </span>
          <span className="truncate font-medium">{project.name}</span>
        </button>

        <div className="absolute right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={onCreatePageClick}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
          >
            <LuPlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onMenuToggle}
            className={`flex items-center justify-center w-5 h-5 rounded text-xs font-bold ${
              isMenuOpen
                ? 'bg-slate-800 text-slate-200'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            &#8942;
          </button>
        </div>
      </div>

      {/* Embedded Sub-Pages Drawer */}
      {isProjectActive && (
        <div className="pl-6 border-l border-slate-800 ml-4 animate-fadeIn">
          {sortedPages.length === 0 ? (
            <div className="text-xs text-slate-600 py-1 pl-2 italic">
              No pages created
            </div>
          ) : (
            <SortableList
              items={sortedPages}
              onMoveItem={(activeId, targetIndex) =>
                onReorderPages(Number(activeId), targetIndex)
              }
              renderItem={(page, index) => {
                const isPageActive =
                  page.id === activePageId &&
                  activeViewMode !== WorkspaceViewMode.ProjectDashboard;
                const isPageMenuOpen =
                  activeMenuTargetId === page.id &&
                  activeMenuType === 'BLOCK_RECON_PAGE';

                return (
                  <SidebarPageItem
                    key={page.id}
                    page={page}
                    index={index}
                    isLast={index === sortedPages.length - 1}
                    isPageActive={isPageActive}
                    isMenuOpen={isPageMenuOpen}
                    onPageClick={() => {
                      // 🎯 Fixed: Routes perfectly to specific document tabs under the correct namespace context
                      navigate(
                        `/${targetNamespace}/projects/${project.id}/pages/${page.id}`,
                      );
                    }}
                    onMenuToggle={(e) => onPageMenuToggle(e, page.id)}
                    onDrop={(activeId, targetIndex) =>
                      onReorderPages(Number(activeId), targetIndex)
                    }
                  />
                );
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};
