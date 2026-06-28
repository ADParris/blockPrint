// src/components/Sidebar.tsx
import { useState } from 'react';
import {
  LuFileText,
  LuFolder,
  LuPlus,
  LuTrash2,
  LuUser,
  LuUsers,
} from 'react-icons/lu'; // 🎯 Added LuUser & LuUsers icons
import { useNavigate, useParams } from 'react-router-dom';
import {
  BaseElement,
  WorkspaceViewMode,
  type Project,
  type WorkspaceViewModeType,
} from '../state/types';
import { useProjectStore } from '../state/useProjectStore';
import DropZone from './DropZone';
import Modal from './Modal';
import { SidebarLayoutToggle } from './SidebarLayoutToggle';
import SortableList from './SortableList';

interface MenuOption {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  className: string;
}

const Sidebar = () => {
  const navigate = useNavigate();
  const { namespace } = useParams<{ namespace: string }>();

  const {
    projects,
    pages,
    groups, // 🎯 Fetch groups to map group IDs to URL slugs
    activeProjectId,
    activePageId,
    activeViewMode,
    currentUser,
    userSortOrders,
    addProject,
    addPage,
    reorderSidebarItems,
    deleteProject,
    deletePage,
  } = useProjectStore((state) => state);

  const [activeMenu, setActiveMenu] = useState<{
    targetId: string;
    type: Omit<WorkspaceViewModeType, 'PAGE_CANVAS'>;
    position: { top: number; left: number };
  } | null>(null);

  const handleMenuClick = (
    e: React.MouseEvent,
    targetId: string,
    type: Omit<WorkspaceViewModeType, 'PAGE_CANVAS'>,
  ) => {
    e.stopPropagation();
    if (activeMenu?.targetId === targetId && activeMenu?.type === type) {
      setActiveMenu(null);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setActiveMenu({
      targetId,
      type,
      position: {
        top: window.scrollY + rect.bottom + 6,
        left: window.scrollX + rect.left - 120,
      },
    });
  };

  // 🎯 Updated to default to personal workspace or optionally a group space in the future
  const handleCreateProject = (groupId: string | null = null) => {
    const name = prompt('Enter project name:');
    if (name) addProject(name, '', groupId);
  };

  const handleCreatePage = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    const title = prompt('Enter page title:');
    if (title) addPage(projectId, title);
  };

  const handleDeleteItem = () => {
    if (!activeMenu) return;
    const { targetId, type } = activeMenu;
    const confirmed = window.confirm(
      `Are you sure you want to delete this ${type.toLowerCase()}?`,
    );

    if (confirmed) {
      if (type.toUpperCase() === 'PROJECT') {
        deleteProject(targetId);
      } else {
        const projectContextId = activeProjectId || '';
        if (projectContextId) {
          deletePage(projectContextId, targetId);
        }
      }
    }
    setActiveMenu(null);
  };

  const userId = currentUser?.id || 'default_user';
  const userRootOrder = userSortOrders[userId];

  // 🎯 Base Sorting Function for reuse across lists
  const sortProjectsByGlobalOrder = (projectList: Project[]) => {
    return [...projectList].sort((a, b) => {
      const globalOrder = userRootOrder?.globalProjectsOrder || [];
      const aIndex = globalOrder.indexOf(a.id);
      const bIndex = globalOrder.indexOf(b.id);
      if (aIndex === -1 || bIndex === -1) return 0;
      return aIndex - bIndex;
    });
  };

  // 🎯 Partition projects based on workspace ownership rules
  const personalProjects = sortProjectsByGlobalOrder(
    projects.filter((p) => p.groupId === null),
  );
  const groupProjects = sortProjectsByGlobalOrder(
    projects.filter((p) => p.groupId !== null),
  );

  const menuOptions: MenuOption[] = activeMenu
    ? [
        {
          label: `Delete ${activeMenu.type === BaseElement.Project ? BaseElement.Project : BaseElement.Page}`,
          icon: LuTrash2,
          onClick: handleDeleteItem,
          className: 'text-red-400 hover:bg-red-500/10',
        },
      ]
    : [];

  // 🎯 REUSABLE PROJECT LIST RENDERER
  const renderProjectList = (
    projectCollection: Project[],
    targetNamespace: string,
  ) => {
    if (projectCollection.length === 0) {
      return (
        <div className="text-xs text-slate-600 pl-2 italic py-1">
          No projects found
        </div>
      );
    }

    return projectCollection.map((project) => {
      const isProjectActive = project.id === activeProjectId;
      const isDashboardActive =
        isProjectActive &&
        activeViewMode === WorkspaceViewMode.ProjectDashboard;
      const projectPages = pages[project.id] || [];

      const pageOrder = userRootOrder?.projectPagesOrder[project.id] || [];
      const sortedPages = [...projectPages].sort((a, b) => {
        const aIndex = pageOrder.indexOf(a.id);
        const bIndex = pageOrder.indexOf(b.id);
        if (aIndex === -1 || bIndex === -1) return 0;
        return aIndex - bIndex;
      });

      return (
        <div key={project.id} className="space-y-1">
          <div className="group relative flex items-center w-full">
            <button
              onClick={() => {
                // 🎯 Dynamically target either personal username or the matched group slug
                navigate(`/${targetNamespace}/projects/${project.id}`);
                setActiveMenu(null);
              }}
              className={`flex items-center w-full text-left pl-2 pr-14 py-1.5 text-sm rounded-md transition-all duration-150 truncate ${
                isDashboardActive
                  ? 'bg-slate-900/80 text-slate-100 font-semibold shadow-sm'
                  : isProjectActive
                    ? 'text-slate-300 font-medium hover:bg-slate-900/10'
                    : 'text-slate-400 hover:bg-slate-900/20 hover:text-slate-200'
              }`}
            >
              <LuFolder
                className={`w-4 h-4 mr-2 shrink-0 ${isProjectActive ? 'text-blue-400' : 'text-slate-500'}`}
              />
              <span className="truncate font-medium">{project.name}</span>
            </button>

            <div className="absolute right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <button
                onClick={(e) => handleCreatePage(e, project.id)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
              >
                <LuPlus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) =>
                  handleMenuClick(e, project.id, BaseElement.Project)
                }
                className={`flex items-center justify-center w-5 h-5 rounded text-xs font-bold ${
                  activeMenu?.targetId === project.id &&
                  activeMenu?.type === BaseElement.Project
                    ? 'bg-slate-800 text-slate-200'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                &#8942;
              </button>
            </div>
          </div>

          {isProjectActive && (
            <div className="pl-6 border-l border-slate-800 ml-4 animate-fadeIn">
              {sortedPages.length === 0 ? (
                <div className="text-xs text-slate-600 py-1 pl-2 italic">
                  No pages created
                </div>
              ) : (
                <SortableList
                  items={sortedPages}
                  onMoveItem={(activeIndex, overIndex) =>
                    reorderSidebarItems(
                      project.id,
                      Number(activeIndex),
                      Number(overIndex),
                      BaseElement.Page,
                    )
                  }
                  renderItem={(page, index) => {
                    const isPageActive =
                      page.id === activePageId &&
                      activeViewMode !== WorkspaceViewMode.ProjectDashboard;
                    const isMenuOpen =
                      activeMenu?.targetId === page.id &&
                      activeMenu?.type === BaseElement.Page;

                    return (
                      <div
                        key={page.id}
                        className="group relative flex flex-col w-full"
                      >
                        <DropZone
                          index={index}
                          size="sm"
                          onDropBlock={(activeId, targetIndex) =>
                            reorderSidebarItems(
                              project.id,
                              Number(activeId),
                              targetIndex,
                              BaseElement.Page,
                            )
                          }
                        />
                        <div className="relative flex items-center w-full min-h-7 my-0.5">
                          <button
                            onClick={() => {
                              navigate(
                                `/${targetNamespace}/projects/${project.id}/pages/${page.id}`,
                              );
                            }}
                            className={`flex items-center w-full text-left pl-2 pr-10 py-1 text-xs rounded transition-all duration-150 truncate select-none ${
                              isPageActive
                                ? 'bg-blue-950/40 text-blue-400 font-medium shadow-sm'
                                : 'text-slate-500 hover:bg-slate-900/40 hover:text-slate-300'
                            }`}
                          >
                            <span
                              data-drag-handle-for={page.id}
                              draggable="true"
                              className="flex items-center shrink-0 mr-2 cursor-grab text-slate-600 hover:text-slate-400 active:cursor-grabbing"
                            >
                              <LuFileText className="w-3.5 h-3.5" />
                            </span>
                            <span className="truncate pr-2">{page.title}</span>
                          </button>
                          <div
                            className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 items-center justify-center ${isMenuOpen ? 'flex' : 'hidden group-hover:flex'}`}
                          >
                            <button
                              onClick={(e) =>
                                handleMenuClick(e, page.id, BaseElement.Page)
                              }
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
                        {index === sortedPages.length - 1 && (
                          <DropZone
                            index={index + 1}
                            size="sm"
                            onDropBlock={(activeId, targetIndex) =>
                              reorderSidebarItems(
                                project.id,
                                Number(activeId),
                                targetIndex,
                                BaseElement.Page,
                              )
                            }
                          />
                        )}
                      </div>
                    );
                  }}
                />
              )}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full p-4 select-none">
      <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 px-2">
        blockPrint PM
      </div>

      <nav className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-1">
        {/* 👤 PERSONAL WORKSPACE SECTION */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 px-2">
            <div className="flex items-center space-x-1.5">
              <LuUser className="w-3.5 h-3.5 text-slate-600" />
              <span>Personal Vault</span>
            </div>
            <button
              onClick={() => handleCreateProject(null)}
              className="flex items-center justify-center w-5 h-5 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors shadow-sm"
            >
              <LuPlus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1">
            {renderProjectList(
              personalProjects,
              currentUser?.name || 'ADParris',
            )}
          </div>
        </div>

        {/* 👥 GROUP WORKSPACE SECTION */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 px-2">
            <div className="flex items-center space-x-1.5">
              <LuUsers className="w-3.5 h-3.5 text-slate-600" />
              <span>Team Spaces</span>
            </div>
            <button
              onClick={() => handleCreateProject('group_design_team')}
              className="flex items-center justify-center w-5 h-5 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors shadow-sm"
            >
              <LuPlus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1">
            {groupProjects.map((project) => {
              // 🎯 Safeguard: Look up the slug, fallback to the current URL namespace, or default to a safe string
              const matchedGroup = project.groupId
                ? groups[project.groupId]
                : null;
              const projectNamespace =
                matchedGroup?.slug || namespace || 'shared-space';

              return renderProjectList([project], projectNamespace);
            })}
            {groupProjects.length === 0 && (
              <div className="text-xs text-slate-600 pl-2 italic py-1">
                No group workspaces active
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="pt-4 border-t border-slate-800/60 mt-auto">
        <SidebarLayoutToggle />
      </div>

      {activeMenu && (
        <Modal
          onClose={() => setActiveMenu(null)}
          menuPosition={activeMenu.position}
        >
          <div className="w-36 p-1 flex flex-col text-left">
            {menuOptions.map((option, index) => {
              const Icon = option.icon;
              return (
                <button
                  key={index}
                  onClick={option.onClick}
                  className={`w-full bg-transparent border-0 outline-none m-0 px-2 py-1.5 text-left text-xs font-medium rounded transition-colors duration-100 flex items-center space-x-1.5 ${option.className}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Sidebar;
