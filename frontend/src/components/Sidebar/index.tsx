// src/components/Sidebar/Sidebar.tsx
import React, { useState } from 'react';
import { LuUser, LuUsers } from 'react-icons/lu';
import { useNavigate, useParams } from 'react-router-dom';
import { DropZoneScope, SidebarElement, type Project } from '../../state/types';
import { useProjectStore } from '../../state/useProjectStore';
import { paths } from '../../utils/routes';
import DropZone from '../DropZone';
import Modal from '../Modal';
import SidebarHeader from './SidebarHeader';
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
      if (type === SidebarElement.Project) {
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
      <SidebarHeader />

      <nav className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-1">
        {/* 👤 PERSONAL WORKSPACE SECTION */}
        <div className="space-y-2">
          <SidebarSectionHeader
            title="Personal Vault"
            icon={LuUser}
            onActionClick={() => handleCreateProject(null)}
          />

          <div className="flex flex-col w-full text-left justify-start items-start">
            {personalProjects.length === 0 ? (
              <div className="text-xs text-fg/60 pl-2 italic py-1">
                No projects found
              </div>
            ) : (
              personalProjects.map((project, index) => {
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
                    {/* 🎯 Gap drop zone directly BEFORE this entry row */}
                    <DropZone
                      index={index}
                      acceptedType={SidebarElement.Project}
                      projectId={null}
                      scope={DropZoneScope.Personal}
                    />

                    <div className="w-full text-left">
                      <SidebarProjectItem
                        project={project}
                        index={index}
                        targetNamespace={currentUser?.name || 'ADParris'}
                        activeProjectId={projectId || null}
                        activePageId={pageId || null}
                        sortedPages={sortedPages}
                        section={DropZoneScope.Personal}
                        onCreatePageClick={(e) =>
                          handleCreatePage(e, project.id)
                        }
                        onMenuToggle={(e) =>
                          handleMenuClick(e, project.id, SidebarElement.Project)
                        }
                        onPageMenuToggle={(e, targetPageId) =>
                          handleMenuClick(e, targetPageId, SidebarElement.Page)
                        }
                      />
                    </div>

                    {/* 🎯 Final trailing target at the direct baseline end of loop */}
                    {index === personalProjects.length - 1 && (
                      <DropZone
                        index={index + 1} // 🎯 FIX: Changed index to index + 1 for clean append placement
                        acceptedType={SidebarElement.Project}
                        projectId={null}
                        scope={DropZoneScope.Personal}
                      />
                    )}
                  </React.Fragment>
                );
              })
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

          <div className="flex flex-col w-full text-left justify-start items-start">
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
                    {/* 🎯 Gap drop zone directly BEFORE this entry row */}
                    <DropZone
                      index={index}
                      acceptedType={SidebarElement.Project}
                      projectId={null}
                      scope={DropZoneScope.Group}
                    />

                    <div className="w-full text-left">
                      <SidebarProjectItem
                        project={project}
                        index={index}
                        targetNamespace={projectNamespace}
                        activeProjectId={projectId || null}
                        activePageId={pageId || null}
                        sortedPages={sortedPages}
                        section={DropZoneScope.Group}
                        onCreatePageClick={(e) =>
                          handleCreatePage(e, project.id)
                        }
                        onMenuToggle={(e) =>
                          handleMenuClick(e, project.id, SidebarElement.Project)
                        }
                        onPageMenuToggle={(e, targetPageId) =>
                          handleMenuClick(e, targetPageId, SidebarElement.Page)
                        }
                      />
                    </div>

                    {/* 🎯 Final trailing target at the direct baseline end of loop */}
                    {index === groupProjects.length - 1 && (
                      <DropZone
                        index={index + 1} // 🎯 FIX: Changed index to index + 1 for clean append placement
                        acceptedType={SidebarElement.Project}
                        projectId={null}
                        scope={DropZoneScope.Group}
                      />
                    )}
                  </React.Fragment>
                );
              })
            )}
          </div>
        </div>
      </nav>

      <div className="pt-4 border-t border-line mt-auto">
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
                {activeMenu.type === SidebarElement.Project
                  ? SidebarElement.Project
                  : SidebarElement.Page}
              </span>
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Sidebar;
