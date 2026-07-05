// src/components/DropZone.tsx
import React from 'react';
import {
  BaseElement,
  type BaseElementType,
  type DropZoneScopeType,
  type ProgressState,
  type SidebarElementType,
} from '../state/types';
import { useProjectStore } from '../state/useProjectStore';

interface DropZoneProps {
  index: number;
  acceptedType: BaseElementType;
  projectId: string | null;
  size?: 'sm' | 'md';
  scope?: DropZoneScopeType;
  columnId?: ProgressState;
  className?: string;
  onCustomDrop?: (sourceIndex: number, targetIndex: number) => void;
  onKanbanDrop?: (
    itemId: string,
    targetColumnId: ProgressState,
    targetIndex: number,
  ) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({
  index,
  acceptedType,
  projectId,
  size = 'md',
  scope,
  columnId,
  onCustomDrop,
  onKanbanDrop,
  className = '',
}) => {
  const [isOver, setIsOver] = React.useState(false);
  const section = useProjectStore((state) => state.activeSidebarDragScope);
  const reorderSidebarItems = useProjectStore(
    (state) => state.reorderSidebarItems,
  );
  const activeSidebarDragObject = useProjectStore(
    (state) => state.activeSidebarDragObject,
  );

  const mimeTypeToken = `application/x-${acceptedType ? acceptedType.toLowerCase() : 'unknown'}`;

  const isRevealed =
    (activeSidebarDragObject === acceptedType &&
      (acceptedType !== BaseElement.Project || scope === section)) ||
    (columnId !== undefined && size === 'md');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (
      e.dataTransfer.types.includes(mimeTypeToken) ||
      e.dataTransfer.types.includes('text/plain')
    ) {
      setIsOver(true);
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDragLeave = () => setIsOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);

    if (columnId && onKanbanDrop) {
      const itemId = e.dataTransfer.getData('text/plain');
      if (!itemId) return;
      onKanbanDrop(itemId, columnId, index);
      return;
    }

    // 1. Try our custom layout token or general plain text data channel
    let draggedPayload = e.dataTransfer.getData(mimeTypeToken);
    if (!draggedPayload) {
      draggedPayload = e.dataTransfer.getData('text/plain');
    }

    // Guard against empty drops safely
    if (!draggedPayload) return;

    if (onCustomDrop) {
      // 🎯 Zero searching required! Just drop the parsed numbers straight up to the store
      onCustomDrop(Number(draggedPayload), index);
    } else {
      reorderSidebarItems(
        acceptedType === BaseElement.Project ? scope : projectId,
        Number(draggedPayload),
        index,
        acceptedType as SidebarElementType,
      );
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      /* 🎯 THE FIX: Handle local `isOver` styling safely here, blending it into 
       the incoming parent layout classes or the default sidebar layout classes */
      className={`${
        className ||
        `w-full transition-all duration-200 relative flex items-center justify-center rounded outline-none z-10 ${
          isRevealed
            ? 'h-4 my-0.5 pointer-events-auto'
            : 'h-1.5 my-0 pointer-events-auto bg-transparent'
        }`
      } ${isOver ? 'bg-blue-500/5' : ''}`} // 💡 Appended beautifully to the outer wrapper
    >
      {/* 🎯 VISUAL INDICATOR LINE */}
      <div
        className={`w-full pointer-events-none rounded transition-all duration-150 ${
          isOver
            ? 'h-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]' /* Instant reactive line strike */
            : isRevealed
              ? 'h-1 bg-slate-700/40'
              : 'h-0.5 bg-transparent'
        }`}
      />
    </div>
  );
};

export default DropZone;
