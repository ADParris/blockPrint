import React from 'react';
import type { BlockType } from '../../../state/types';

interface BlockDragHandleProps {
  blockId: string;
  blockType: BlockType;
  index: number;
}

const BlockDragHandle: React.FC<BlockDragHandleProps> = ({
  blockId,
  blockType,
  index,
}) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.setData(
      `application/x-${blockType.toLowerCase()}`,
      String(index),
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:z-50">
      <div
        className="group/handle relative flex h-8 w-5 items-center justify-center rounded-md cursor-grab active:cursor-grabbing select-none transition-colors text-slate-600 hover:text-slate-400"
        contentEditable={false}
        data-drag-handle-for={blockId}
        draggable
        onDragStart={handleDragStart}
      >
        <svg width="12" height="18" viewBox="0 0 12 24" fill="currentColor">
          <circle cx="2" cy="4" r="1.5" />
          <circle cx="2" cy="12" r="1.5" />
          <circle cx="2" cy="20" r="1.5" />
          <circle cx="10" cy="4" r="1.5" />
          <circle cx="10" cy="12" r="1.5" />
          <circle cx="10" cy="20" r="1.5" />
        </svg>

        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover/handle:flex flex-col items-center bg-[#0f1115] border border-slate-800 text-[11px] leading-relaxed text-slate-300 px-2.5 py-1.5 rounded-md shadow-2xl pointer-events-none whitespace-nowrap z-50 text-center">
          <span>Drag to move.</span>
          <span className="text-slate-400 text-[10px]">
            Click to open menu.
          </span>
        </div>
      </div>
    </div>
  );
};

export default BlockDragHandle;
