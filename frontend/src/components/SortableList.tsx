// src/components/SortableList.tsx
import React from 'react';
import { type BaseElementType } from '../state/types';
import DropZone from './DropZone';

interface SortableListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  projectId: string | null;
  // 1. Explicitly accept the drag type here
  dragType: BaseElementType;
  onMoveItem?: (sourceIndex: number, targetIndex: number) => void;
}

function SortableList<T extends { id: string }>({
  items,
  renderItem,
  projectId,
  dragType, // 2. Pull it from props
  onMoveItem,
}: SortableListProps<T>) {
  const isBlock = dragType === 'BLOCK';

  return (
    <div className="flex flex-col w-full text-left">
      {items.length === 0 ? (
        <div className="text-xs text-fg-muted pl-2 italic py-2">
          No items found
        </div>
      ) : (
        items.map((item, index) => (
          <React.Fragment key={item.id}>
            <DropZone
              index={index}
              acceptedType={dragType}
              projectId={projectId}
              size={isBlock ? 'sm' : 'md'}
              onCustomDrop={onMoveItem}
            />

            <div className="w-full text-left">{renderItem(item, index)}</div>

            {index === items.length - 1 && (
              <DropZone
                index={index + 1}
                acceptedType={dragType}
                projectId={projectId}
                size={isBlock ? 'sm' : 'md'}
                onCustomDrop={onMoveItem}
              />
            )}
          </React.Fragment>
        ))
      )}
    </div>
  );
}

export default SortableList;
