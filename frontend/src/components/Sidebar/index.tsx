import React, { useState } from 'react';
import { LuUser, LuUsers } from 'react-icons/lu';
import { useParams } from 'react-router-dom';
import { BaseElement, type Project } from '../../state/types';
import { useProjectStore } from '../../state/useProjectStore';
import DropZone from '../DropZone';
import Modal from '../Modal';
import { SidebarLayoutToggle } from './SidebarLayoutToggle';
import { SidebarProjectItem } from './SidebarProjectItem';
import SidebarSectionHeader from './SidebarSectionHeader';

const Sidebar = () => {
  const { namespace } = useParams<{ namespace: string }>();

  const {
    projects,
    pages,
    groups,
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
    type: string;
    position: { top: number; left: number };
  } | null>(null);

  const handleMenuClick = (
    e: React.MouseEvent,
    targetId: string,
    type: string,
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
      if (type === BaseElement.Project) {
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

  const sortProjectsByGlobalOrder = (projectList: Project[]) => {
    return [...projectList].sort((a, b) => {
      const globalOrder = userRootOrder?.globalProjectsOrder || [];
      const aIndex = globalOrder.indexOf(a.id);
      const bIndex = globalOrder.indexOf(b.id);
      if (aIndex === -1 || bIndex === -1) return 0;
      return aIndex - bIndex;
    });
  };

  const personalProjects = sortProjectsByGlobalOrder(
    projects.filter((p) => p.groupId === null),
  );
  const groupProjects = sortProjectsByGlobalOrder(
    projects.filter((p) => p.groupId !== null),
  );

  return (
    <div className="flex flex-col h-full p-4 select-none">
      <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 px-2">
        blockPrint PM
      </div>

      <nav className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-1">
        {/* 👤 PERSONAL WORKSPACE SECTION */}
        <div className="space-y-2">
          <SidebarSectionHeader
            title="Personal Vault"
            icon={LuUser}
            onActionClick={() => handleCreateProject(null)}
          />
          <div className="space-y-1 relative w-full">
            {personalProjects.length === 0 ? (
              <div className="text-xs text-slate-600 pl-2 italic py-1">
                No projects found
              </div>
            ) : (
              <>
                {personalProjects.map((project, index) => {
                  const projectPages = pages[project.id] || [];
                  const pageOrder =
                    userRootOrder?.projectPagesOrder[project.id] || [];
                  const sortedPages = [...projectPages].sort((a, b) => {
                    const aIndex = pageOrder.indexOf(a.id);
                    const bIndex = pageOrder.indexOf(b.id);
                    return aIndex - bIndex;
                  });

                  return (
                    <React.Fragment key={project.id}>
                      <DropZone
                        index={index}
                        size="sm"
                        onDropBlock={(activeId) =>
                          reorderSidebarItems(null, activeId, index, 'project')
                        }
                      />
                      <SidebarProjectItem
                        project={project}
                        targetNamespace={currentUser?.name || 'ADParris'}
                        activeProjectId={activeProjectId}
                        activePageId={activePageId}
                        activeViewMode={activeViewMode}
                        sortedPages={sortedPages}
                        isMenuOpen={
                          activeMenu?.targetId === project.id &&
                          activeMenu?.type === BaseElement.Project
                        }
                        onCreatePageClick={(e) =>
                          handleCreatePage(e, project.id)
                        }
                        onMenuToggle={(e) =>
                          handleMenuClick(e, project.id, BaseElement.Project)
                        }
                        onPageMenuToggle={(e, pageId) =>
                          handleMenuClick(e, pageId, BaseElement.Page)
                        }
                        onReorderPages={(activeIndex, overIndex) =>
                          reorderSidebarItems(
                            project.id,
                            activeIndex,
                            overIndex,
                            'page',
                          )
                        }
                        activeMenuTargetId={activeMenu?.targetId}
                        activeMenuType={activeMenu?.type}
                      />
                    </React.Fragment>
                  );
                })}

                {/* 🎯 Clean Trailing DropZone at the absolute bottom of the list */}
                <DropZone
                  index={personalProjects.length}
                  size="sm"
                  onDropBlock={(activeId) =>
                    reorderSidebarItems(
                      null,
                      activeId,
                      personalProjects.length,
                      'project',
                    )
                  }
                />
              </>
            )}
          </div>
        </div>

        {/* 👥 GROUP WORKSPACE SECTION */}
        <div className="space-y-2">
          <SidebarSectionHeader
            title="Team Spaces"
            icon={LuUsers}
            onActionClick={() => handleCreateProject('group_design_team')}
          />
          <div className="space-y-1 relative w-full">
            {groupProjects.length === 0 ? (
              <div className="text-xs text-slate-600 pl-2 italic py-1">
                No group workspaces active
              </div>
            ) : (
              groupProjects.map((project, index) => {
                const matchedGroup = project.groupId
                  ? groups[project.groupId]
                  : null;
                const projectNamespace =
                  matchedGroup?.slug || namespace || 'shared-space';

                const projectPages = pages[project.id] || [];
                const pageOrder =
                  userRootOrder?.projectPagesOrder[project.id] || [];
                const sortedPages = [...projectPages].sort((a, b) => {
                  const aIndex = pageOrder.indexOf(a.id);
                  const bIndex = pageOrder.indexOf(b.id);
                  return aIndex - bIndex;
                });

                return (
                  <React.Fragment key={project.id}>
                    <DropZone
                      index={index}
                      size="sm"
                      onDropBlock={(activeId) =>
                        reorderSidebarItems(
                          null,
                          activeId,
                          project.id,
                          BaseElement.Project,
                        )
                      }
                    />
                    <SidebarProjectItem
                      key={project.id}
                      project={project}
                      targetNamespace={projectNamespace}
                      activeProjectId={activeProjectId}
                      activePageId={activePageId}
                      activeViewMode={activeViewMode}
                      sortedPages={sortedPages}
                      isMenuOpen={
                        activeMenu?.targetId === project.id &&
                        activeMenu?.type === BaseElement.Project
                      }
                      onCreatePageClick={(e) => handleCreatePage(e, project.id)}
                      onMenuToggle={(e) =>
                        handleMenuClick(e, project.id, BaseElement.Project)
                      }
                      onPageMenuToggle={(e, pageId) =>
                        handleMenuClick(e, pageId, BaseElement.Page)
                      }
                      onReorderPages={(activeIndex, overIndex) =>
                        reorderSidebarItems(
                          project.id,
                          activeIndex,
                          overIndex,
                          BaseElement.Page,
                        )
                      }
                      activeMenuTargetId={activeMenu?.targetId}
                      activeMenuType={activeMenu?.type}
                    />
                    {index === groupProjects.length - 1 && (
                      <DropZone
                        index={index + 1}
                        size="sm"
                        onDropBlock={(activeId) =>
                          reorderSidebarItems(
                            null,
                            activeId,
                            'APPEND_GROUP',
                            BaseElement.Project,
                          )
                        }
                      />
                    )}
                  </React.Fragment>
                );
              })
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
            <button
              onClick={handleDeleteItem}
              className="w-full bg-transparent border-0 outline-none m-0 px-2 py-1.5 text-left text-xs font-medium rounded transition-colors duration-100 flex items-center space-x-1.5 text-red-400 hover:bg-red-500/10"
            >
              <span>
                Delete{' '}
                {activeMenu.type === BaseElement.Project ? 'Project' : 'Page'}
              </span>
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Sidebar;
