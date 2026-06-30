import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  type CanvasBlock,
  type ProgressState,
  WorkspaceViewMode,
} from '../../state/types';
import { useProjectStore } from '../../state/useProjectStore';
import { paths } from '../../utils/routes';
import Card from '../Card';
import { KanbanBoard } from '../KanbanBoard';

const COLUMNS: { id: ProgressState; title: string; color: string }[] = [
  { id: 'Pending', title: 'To Do', color: 'border-t-slate-500' },
  { id: 'InProgress', title: 'In Production', color: 'border-t-amber-500' },
  { id: 'Completed', title: 'Completed', color: 'border-t-emerald-500' },
];

export const BlockKanbanView: React.FC = () => {
  const getPageBlocks = useProjectStore((state) => state.getPageBlocks);
  const moveBlockInKanban = useProjectStore((state) => state.moveBlockInKanban);
  const setActiveBlockId = useProjectStore((state) => state.setActiveBlockId);
  const setWorkspaceViewMode = useProjectStore(
    (state) => state.setWorkspaceViewMode,
  );
  const navigate = useNavigate();
  const { namespace, projectId, pageId } = useParams<{
    namespace: string;
    projectId: string;
    pageId: string;
  }>();
  const location = useLocation();

  const handleOnBackClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const origin = location.state?.from || 'roadmap';
    if (origin === 'roadmap') {
      setWorkspaceViewMode(WorkspaceViewMode.PageKanban);
      navigate(paths.projectRoadmap(namespace || 'ADParris', projectId!));
    } else if (origin === 'document') {
      setWorkspaceViewMode(WorkspaceViewMode.PageDocument);
      navigate(
        paths.pageDocument(namespace || 'ADParris', projectId!, pageId!),
      );
    }
  };

  return (
    <KanbanBoard<CanvasBlock>
      title="Element Tracker"
      subtitle="Organize and monitor the implementation status of individual page blocks."
      columns={COLUMNS}
      itemsByColumn={(columnId) => getPageBlocks(columnId as ProgressState)}
      onMoveItem={(blockId, targetColumnId, targetIndex) =>
        moveBlockInKanban(blockId, targetColumnId, targetIndex)
      }
      onBack={handleOnBackClick}
      renderCard={(block) => (
        <Card onClick={() => setActiveBlockId(block.id)}>
          <div className="flex items-start justify-between gap-2">
            <div className="w-full min-w-0">
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                {block.type}
              </span>
              <p className="text-xs font-medium text-slate-300 mt-2 truncate line-clamp-2 whitespace-normal">
                {block.content || (
                  <span className="text-slate-600 italic">Empty element</span>
                )}
              </p>
            </div>
          </div>
        </Card>
      )}
    />
  );
};
