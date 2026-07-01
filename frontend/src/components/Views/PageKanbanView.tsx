// src/components/Kanban/PageKanbanView.tsx
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Page, ProgressState } from '../../state/types';
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

  // 🎯 1. Extract parameters directly out of the address path
  const { namespace, projectId } = useParams<{
    namespace: string;
    projectId: string;
  }>();

  // 🎯 2. Atomic Selector Subscriptions for clean rendering performance
  const getProjectPages = useProjectStore((state) => state.getProjectPages);
  const movePageInKanban = useProjectStore((state) => state.movePageInKanban);

  const targetNamespace = namespace || 'ADParris';

  const handleCardClick = (pageId: string) => {
    if (!projectId) return;
    navigate(paths.pageKanban(targetNamespace, projectId, pageId));
  };

  const handleOnBackClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    if (projectId) {
      navigate(paths.projectDashboard(targetNamespace, projectId));
    } else {
      navigate(`/${targetNamespace}`);
    }
  };

  return (
    <KanbanBoard<Page>
      title="Project Roadmap"
      subtitle="Track and organize documents and features across production pipelines."
      columns={COLUMNS}
      itemsByColumn={(columnId) =>
        getProjectPages(projectId, columnId as ProgressState)
      }
      onMoveItem={(pageId, targetColumnId, targetIndex) =>
        movePageInKanban(
          projectId,
          pageId,
          targetColumnId as ProgressState,
          targetIndex,
        )
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
