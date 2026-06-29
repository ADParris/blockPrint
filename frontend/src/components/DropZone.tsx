// src/components/DropZone.tsx
import React, { useState } from 'react';
import type { ProgressState } from '../state/types';

interface DropZoneProps {
  index: number;
  // 🎯 Updated to optionally supply the target lane back to the consumer
  onDropBlock: (
    activeId: string,
    targetIndex: number,
    columnId?: ProgressState,
  ) => void;
  columnId?: ProgressState; // 🎯 New optional prop for Kanban columns
  size?: 'sm' | 'md' | 'lg';
}

const DropZone: React.FC<DropZoneProps> = ({
  index,
  onDropBlock,
  columnId,
  size = 'md',
}) => {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    const draggedBlockId = e.dataTransfer.getData('text/plain');
    if (draggedBlockId) {
      // 🎯 Passes the columnId safely downstream if it's provided
      onDropBlock(draggedBlockId, index, columnId);
    }
  };

  const sizeClasses = {
    sm: 'absolute left-0 right-0 h-1.5 -translate-y-1/2 z-20',
    md: `relative h-8 -my-3 z-10 ${columnId ? 'w-auto -mx-4' : 'w-full'}`,
    lg: `relative h-12 -my-4 z-10 ${columnId ? 'w-auto -mx-4' : 'w-full'}`,
  };

  const indicatorSpacing = {
    sm: 'left-6 right-2 h-0.5',
    md: columnId ? 'left-4 right-4 h-0.5' : 'left-8 right-4 h-0.5',
    lg: columnId ? 'left-4 right-4 h-1' : 'left-12 right-6 h-1',
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`transition-all duration-150 select-none ${sizeClasses[size]}`}
    >
      <div
        className={`absolute bg-sky-500 rounded transition-all duration-150 pointer-events-none ${
          indicatorSpacing[size]
        } ${
          isOver
            ? 'opacity-100 scale-y-120 shadow-[0_0_8px_rgba(14,165,233,0.5)]'
            : 'opacity-0'
        }`}
        style={
          size === 'sm'
            ? { top: 'calc(50% - 1px)' }
            : { top: '50%', transform: 'translateY(-50%)' }
        }
      />
    </div>
  );
};

export default DropZone;
