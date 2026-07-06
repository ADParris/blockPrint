// src/components/Kanban/PageBlockKanbanView.tsx
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  type ActivityFeedItem,
  ActivityFeedItems,
  BaseElement,
  type CanvasBlock,
  type ProgressState,
  WorkspaceViewMode,
} from '../../state/types';
import { useProjectStore } from '../../state/useProjectStore';
import { paths } from '../../utils/routes';
import Card from '../Card';
import { KanbanBoard } from '../KanbanBoard';
import BlockPreviewRenderer from '../Previews/BlockPreviewRenderer';

const COLUMNS: { id: ProgressState; title: string; color: string }[] = [
  { id: 'Pending', title: 'Pending', color: 'border-t-slate-500' },
  { id: 'InProgress', title: 'In Progress', color: 'border-t-blue-500' },
  { id: 'Completed', title: 'Completed', color: 'border-t-emerald-500' },
];

export const PageBlockKanbanView: React.FC = () => {
  const navigate = useNavigate();
  const { namespace, projectId, pageId } = useParams<{
    namespace: string;
    projectId: string;
    pageId: string;
  }>();

  const getPageBlocks = useProjectStore((state) => state.getPageBlocks);
  const moveBlockInKanban = useProjectStore((state) => state.moveBlockInKanban);

  const targetNamespace = namespace || 'ADParris';
  const targetProjectId = projectId || 'default-project';

  // 🎯 Clean and isolated single project timeline subscription
  const projectFeed: ActivityFeedItem[] = useProjectStore(
    (state) => state.activityFeedItems[targetProjectId] || [],
  );

  const filteredBlocks = (columnId: ProgressState) => {
    return getPageBlocks(targetProjectId, pageId, columnId).filter((block) => {
      // 🔍 Safely normalize strings to handle potential case discrepancies ('note' vs 'NOTE')
      const isTimelineNote = projectFeed.some(
        (item) =>
          item.targetBlockId === block.id &&
          item.type === ActivityFeedItems.Note,
      );

      // If it's a timeline note, hide it from the Kanban board!
      return !isTimelineNote;
    });
  };

  const handleOnBackClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    navigate(paths.projectRoadmap(targetNamespace, targetProjectId));
  };

  return (
    <KanbanBoard<CanvasBlock>
      title="Canvas Block Pipeline"
      subtitle="Organize, prioritize, and process individual visual elements across production lanes."
      columns={COLUMNS}
      elementType={BaseElement.Block}
      itemsByColumn={(columnId) => filteredBlocks(columnId as ProgressState)}
      onMoveItem={(blockId, targetColumnId, targetIndex) =>
        moveBlockInKanban(
          projectId,
          pageId,
          blockId,
          targetColumnId as ProgressState,
          targetIndex,
        )
      }
      onBack={handleOnBackClick}
      renderCard={(block) => {
        return (
          <Card viewContext={WorkspaceViewMode.PageKanban} block={block}>
            <div className="max-h-24 overflow-hidden rounded-lg border border-slate-800/40 bg-slate-950/40 pointer-events-none">
              <BlockPreviewRenderer block={block} />
            </div>
          </Card>
        );
      }}
    />
  );
};
