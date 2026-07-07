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

// 🎯 Static reference placeholder sitting entirely outside the component scope
const EMPTY_FEED: ActivityFeedItem[] = [];

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

  // Back to a standard selector, safely using our static external reference fallback
  const projectFeed = useProjectStore(
    (state) => state.activityFeedItems[targetProjectId] || EMPTY_FEED,
  );

  // This will remain perfectly stable now because EMPTY_FEED never changes pointers
  const handleGetItemsByColumn = React.useCallback(
    (columnId: ProgressState) => {
      return getPageBlocks(targetProjectId, pageId, columnId).filter(
        (block) => {
          const isTimelineNote = projectFeed.some(
            (item) =>
              item.targetBlockId === block.id &&
              item.type === ActivityFeedItems.Note,
          );
          return !isTimelineNote;
        },
      );
    },
    [getPageBlocks, targetProjectId, pageId, projectFeed],
  );

  const handleMoveItem = React.useCallback(
    (blockId: string, targetColumnId: ProgressState, targetIndex: number) => {
      moveBlockInKanban(
        projectId,
        pageId,
        blockId,
        targetColumnId,
        targetIndex,
      );
    },
    [moveBlockInKanban, projectId, pageId],
  );

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
      itemsByColumn={handleGetItemsByColumn}
      onMoveItem={handleMoveItem}
      onBack={handleOnBackClick}
      renderCard={(block) => (
        <Card viewContext={WorkspaceViewMode.PageKanban} block={block}>
          <div className="max-h-24 overflow-hidden rounded-lg border border-slate-800/40 bg-slate-950/40 pointer-events-none">
            <BlockPreviewRenderer block={block} />
          </div>
        </Card>
      )}
    />
  );
};
