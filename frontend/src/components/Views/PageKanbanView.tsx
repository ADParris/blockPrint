import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  WorkspaceViewMode,
  type Page,
  type ProgressState,
} from '../../state/types';
import { useProjectStore } from '../../state/useProjectStore';
import { paths } from '../../utils/routes';
import Card from '../Card';
import { KanbanBoard } from '../KanbanBoard';

const COLUMNS: { id: ProgressState; title: string; color: string }[] = [
  { id: 'Pending', title: 'Pending', color: 'border-t-slate-500' },
  { id: 'InProgress', title: 'In Progress', color: 'border-t-blue-500' },
  { id: 'Completed', title: 'Completed', color: 'border-t-emerald-500' },
];

export const PageKanbanView: React.FC = () => {
  const navigate = useNavigate();
  const getProjectPages = useProjectStore((state) => state.getProjectPages);
  const movePageInKanban = useProjectStore((state) => state.movePageInKanban);
  const setWorkspaceViewMode = useProjectStore(
    (state) => state.setWorkspaceViewMode,
  );
  const setActivePageId = useProjectStore((state) => state.setActivePageId);
  const { namespace, projectId } = useParams<{
    namespace: string;
    projectId: string;
  }>();

  const handleCardClick = (pageId: string) => {
    setActivePageId(pageId);
    setWorkspaceViewMode(WorkspaceViewMode.PageKanban);

    // 🎯 Push the pageId into the browser URL path so GlobalView catches the parameter shift
    navigate(paths.pageRoadmap(namespace || 'ADParris', projectId!, pageId), {
      state: { from: 'roadmap' },
    });
  };

  const handleOnBackClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    // 🎯 If we are at the Project level Roadmap, we *must* go back to the Dashboard
    if (projectId) {
      setWorkspaceViewMode(WorkspaceViewMode.ProjectDashboard);
      navigate(paths.projectDashboard(namespace || 'ADParris', projectId));
    }
    // 🎯 Ultimate baseline fallback
    else {
      navigate(`/${namespace || 'ADParris'}`);
    }
  };

  return (
    <KanbanBoard<Page>
      title="Project Roadmap"
      subtitle="Track and organize documents and features across production pipelines."
      columns={COLUMNS}
      itemsByColumn={(columnId) => getProjectPages(columnId as ProgressState)}
      onMoveItem={(pageId, targetColumnId, targetIndex) =>
        movePageInKanban(pageId, targetColumnId as ProgressState, targetIndex)
      }
      onBack={handleOnBackClick}
      renderCard={(page) => (
        <Card onClick={() => handleCardClick(page.id)}>
          <div className="flex items-start justify-between gap-2">
            <div className="w-full min-w-0">
              <p className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
                📄 {page.title || 'Untitled Page'}
              </p>
              <p className="text-[10px] text-slate-500 mt-1 tracking-wide">
                Contains {page.blocks?.length || 0} production elements
              </p>
            </div>
          </div>
        </Card>
      )}
    />
  );
};
