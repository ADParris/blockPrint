// src/components/Sidebar/Sidebar.tsx
import React, { useState } from 'react';
import { LuUser, LuUsers } from 'react-icons/lu';
import { useNavigate, useParams } from 'react-router-dom';
import { BaseElement, type Project } from '../../state/types';
import { useProjectStore } from '../../state/useProjectStore';
import { paths } from '../../utils/routes';
import DropZone from '../DropZone';
import Modal from '../Modal';
import { SidebarLayoutToggle } from './SidebarLayoutToggle';
import { SidebarProjectItem } from './SidebarProjectItem';
import SidebarSectionHeader from './SidebarSectionHeader';

const Sidebar = () => {
  // 🎯 1. Extract structural routing contexts directly from URL parameters
  const { namespace, projectId, pageId } = useParams<{
    namespace: string;
    projectId?: string;
    pageId?: string;
  }>();
  const navigate = useNavigate();

  // 🎯 2. Atomic Selector Subscriptions to enforce stable rendering
  const projects = useProjectStore((state) => state.projects);
  const pages = useProjectStore((state) => state.pages);
  const groups = useProjectStore((state) => state.groups);
  const currentUser = useProjectStore((state) => state.currentUser);
  const userSortOrders = useProjectStore((state) => state.userSortOrders);

  const addProject = useProjectStore((state) => state.addProject);
  const addPage = useProjectStore((state) => state.addPage);
  const reorderSidebarItems = useProjectStore(
    (state) => state.reorderSidebarItems,
  );
  const deleteProject = useProjectStore((state) => state.deleteProject);
  const deletePage = useProjectStore((state) => state.deletePage);

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

  // 🎯 3. Handle reactive routing natively when creating elements
  const handleCreateProject = (groupId: string | null = null) => {
    const name = prompt('Enter project name:');
    if (name) {
      const newProjectId = addProject(name, '', groupId);
      const targetNamespace = groupId
        ? groups[groupId]?.slug || 'shared-space'
        : currentUser?.name || 'ADParris';
      navigate(paths.projectDashboard(targetNamespace, newProjectId));
    }
  };

  const handleCreatePage = (e: React.MouseEvent, targetProjectId: string) => {
    e.stopPropagation();
    const title = prompt('Enter page title:');
    if (title) {
      const newPageId = addPage(targetProjectId, title);
      const project = projects.find((p) => p.id === targetProjectId);
      const targetNamespace = project?.groupId
        ? groups[project.groupId]?.slug || 'shared-space'
        : currentUser?.name || 'ADParris';
      navigate(paths.pageDocument(targetNamespace, targetProjectId, newPageId));
    }
  };

  const handleDeleteItem = () => {
    if (!activeMenu) return;
    const { targetId, type } = activeMenu;
    const confirmed = window.confirm(
      `Are you sure you want to delete this ${type.toLowerCase()}?`,
    );

    if (confirmed) {
      const targetNamespace = namespace || currentUser?.name || 'ADParris';
      if (type === BaseElement.Project) {
        deleteProject(targetId);
        if (projectId === targetId) navigate(`/${targetNamespace}`);
      } else {
        const projectContextId = projectId || '';
        if (projectContextId) {
          deletePage(projectContextId, targetId);
          if (pageId === targetId)
            navigate(
              `/${targetNamespace}/projects/${projectContextId}/dashboard`,
            );
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
                          reorderSidebarItems(
                            null,
                            activeId,
                            project.id,
                            BaseElement.Project,
                          )
                        }
                      />
                      <SidebarProjectItem
                        project={project}
                        targetNamespace={currentUser?.name || 'ADParris'}
                        activeProjectId={projectId || null}
                        activePageId={pageId || null}
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
                        onPageMenuToggle={(e, targetPageId) =>
                          handleMenuClick(e, targetPageId, 'BLOCK_RECON_PAGE')
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
                    </React.Fragment>
                  );
                })}

                <DropZone
                  index={personalProjects.length}
                  size="sm"
                  onDropBlock={(activeId) =>
                    reorderSidebarItems(
                      null,
                      activeId,
                      'APPEND_PERSONAL',
                      BaseElement.Project,
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
                          'group_design_team',
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
                      activeProjectId={projectId || null}
                      activePageId={pageId || null}
                      sortedPages={sortedPages}
                      isMenuOpen={
                        activeMenu?.targetId === project.id &&
                        activeMenu?.type === BaseElement.Project
                      }
                      onCreatePageClick={(e) => handleCreatePage(e, project.id)}
                      onMenuToggle={(e) =>
                        handleMenuClick(e, project.id, BaseElement.Project)
                      }
                      onPageMenuToggle={(e, targetPageId) =>
                        handleMenuClick(e, targetPageId, 'BLOCK_RECON_PAGE')
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
                            'group_design_team',
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
