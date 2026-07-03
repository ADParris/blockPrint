// src/components/Kanban/PageBlockKanbanView.tsx
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  type CanvasBlock,
  type ProgressState,
  WorkspaceViewMode,
} from '../../state/types';
import { useProjectStore } from '../../state/useProjectStore';
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

  // 🎯 Use the decoupled selectors built directly into your store interface
  const getPageBlocks = useProjectStore((state) => state.getPageBlocks);
  const moveBlockInKanban = useProjectStore((state) => state.moveBlockInKanban);

  const targetNamespace = namespace || 'ADParris';

  const handleOnBackClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    navigate(
      `/${targetNamespace}/projects/${projectId}/pages/${pageId}/canvas`,
    );
  };

  return (
    <KanbanBoard<CanvasBlock>
      title="Canvas Block Pipeline"
      subtitle="Organize, prioritize, and process individual visual elements across production lanes."
      columns={COLUMNS}
      // 🎯 Pull blocks using your decoupled store layout helper
      itemsByColumn={(columnId) =>
        getPageBlocks(projectId, pageId, columnId as ProgressState)
      }
      // 🎯 Commit structural relocations cleanly via the block pipeline selector
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
