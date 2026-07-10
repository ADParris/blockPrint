// src/components/Sidebar/SidebarProjectItem.tsx
import React from 'react';
import { LuEllipsisVertical, LuFolder, LuPlus } from 'react-icons/lu';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  DropZoneScope,
  type DropZoneScopeType,
  type Page,
  type Project,
  SidebarElement,
} from '../../state/types';
import { useProjectStore } from '../../state/useProjectStore';
import { paths } from '../../utils/routes';
import Button from '../Button';
import SortableList from '../SortableList';
import { SidebarPageItem } from './SidebarPageItem';

interface SidebarProjectItemProps {
  project: Project;
  index: number;
  targetNamespace: string;
  activeProjectId: string | null;
  activePageId: string | null;
  section: DropZoneScopeType;
  sortedPages: Page[];
  onCreatePageClick: (e: React.MouseEvent) => void;
  onMenuToggle: (e: React.MouseEvent) => void;
  onPageMenuToggle: (e: React.MouseEvent, pageId: string) => void;
}

export const SidebarProjectItem: React.FC<SidebarProjectItemProps> = ({
  project,
  index,
  targetNamespace,
  activeProjectId,
  activePageId,
  sortedPages,
  section,
  onCreatePageClick,
  onMenuToggle,
  onPageMenuToggle,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const setActiveSidebarDrag = useProjectStore(
    (state) => state.setActiveSidebarDrag,
  );

  // 🎯 Determine layout view mode directly from browser URL location path flags
  const isProjectActive = project.id === activeProjectId;
  const isDashboardActive =
    isProjectActive && location.pathname.endsWith('/dashboard');

  return (
    <div className="space-y-1">
      <div className="group/outer relative flex items-center w-full">
        <Button
          onClick={() => {
            navigate(paths.projectDashboard(targetNamespace, project.id));
          }}
          className={`text-left pl-2 pr-14 py-1.5 text-sm w-full ${
            isDashboardActive
              ? 'text-fg' // Active
              : 'text-fg/60 hover:text-fg group-hover/outer:text-fg' // Default
          }`}
        >
          <span
            className="cursor-grab active:cursor-grabbing mr-2 shrink-0"
            draggable="true"
            onDragStart={(e) => {
              e.stopPropagation();
              e.dataTransfer.setData('text/plain', String(index));
              e.dataTransfer.setData(
                `application/x-${SidebarElement.Project.toLowerCase()}`,
                String(index),
              );
              e.dataTransfer.effectAllowed = 'move';
              setActiveSidebarDrag(
                SidebarElement.Project,
                section === DropZoneScope.Personal
                  ? DropZoneScope.Personal
                  : DropZoneScope.Group,
              );
            }}
            onDragEnd={() => {
              setActiveSidebarDrag(null, null);
            }}
          >
            <LuFolder
              className={`w-4 h-4 ${
                isDashboardActive
                  ? 'text-accent-blue' // Active
                  : 'text-accent-blue/60 group-hover/button:text-accent-blue group-hover/outer:text-accent-blue' // Inactive
              }`}
            />
          </span>
          {project.name}
        </Button>

        <div
          className={`absolute right-2 flex items-center space-x-1 group-hover/outer:opacity-100 transition-opacity duration-150${isDashboardActive ? ' opacity-100' : ' opacity-0'}`}
        >
          <Button onClick={onCreatePageClick}>
            <LuPlus className="w-4 h-4 text-fg/40 group-hover/button:text-fg transition-colors" />
          </Button>
          <Button onClick={onMenuToggle}>
            <LuEllipsisVertical className="w-4 h-4 text-fg/40 group-hover/button:text-fg" />
          </Button>
        </div>
      </div>

      {/* Embedded Sub-Pages Drawer */}
      {isProjectActive && (
        <div className="pl-6 border-l border-line ml-4 animate-fadeIn">
          {sortedPages.length === 0 ? (
            <div className="text-xs text-fg/60 py-1 pl-2 italic">
              No pages created
            </div>
          ) : (
            <SortableList
              items={sortedPages}
              dragType={SidebarElement.Page}
              projectId={project.id}
              renderItem={(page, index) => {
                const isPageActive =
                  page.id === activePageId && !isDashboardActive;

                return (
                  <SidebarPageItem
                    key={page.id}
                    page={page}
                    index={index}
                    isPageActive={isPageActive}
                    onPageClick={() => {
                      navigate(
                        paths.pageDocument(
                          targetNamespace,
                          project.id,
                          page.id,
                        ),
                      );
                    }}
                    onMenuToggle={(e) => onPageMenuToggle(e, page.id)}
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
