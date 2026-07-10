import React from 'react';
import type { ActivityFeedItemsType, BlockType } from '../../../state/types';
import BlockDragHandle from './BlockDragHandle';

interface BlockShellProps {
  blockId: string;
  blockType: BlockType;
  index: number;
  statusType: ActivityFeedItemsType | null;
  children: React.ReactNode;
}

const BlockShell: React.FC<BlockShellProps> = ({
  blockId,
  blockType,
  index,
  statusType,
  children,
}) => {
  const isDecoratedStatus = statusType === 'STUB' || statusType === 'NOTE';

  const statusContentPaddingClass = isDecoratedStatus ? 'pl-2 pr-2' : '';

  const statusBorderClass =
    statusType === 'STUB'
      ? 'border-accent-amber/80 shadow-accent-amber/10'
      : statusType === 'NOTE'
        ? 'border-accent-blue/80 shadow-accent-blue/10'
        : 'border-transparent';

  return (
    <div
      id={`block-${blockId}`}
      className="group relative flex flex-col items-start w-full pl-10 pr-4 min-h-7 py-1.5 my-1.5 overflow-visible"
      style={{ contentVisibility: 'visible' }}
    >
      <BlockDragHandle blockId={blockId} blockType={blockType} index={index} />
      <div
        className={`relative w-full rounded-lg border overflow-visible transition-all duration-200 py-1 ${statusBorderClass} ${statusContentPaddingClass}`}
        style={{ contentVisibility: 'visible' }}
      >
        {isDecoratedStatus && (
          <div
            className={`absolute -top-2.5 right-4 z-20 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase select-none border shadow-sm bg-surface overflow-hidden ${
              statusType === 'STUB'
                ? 'text-accent-amber border-accent-amber/60'
                : 'text-accent-blue border-accent-blue/60'
            }`}
            style={{ contentVisibility: 'visible' }}
          >
            <span
              className={`absolute inset-0 pointer-events-none ${
                statusType === 'STUB'
                  ? 'bg-accent-amber/10'
                  : 'bg-accent-blue/10'
              }`}
            />
            <span className="relative">{statusType}</span>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default BlockShell;
