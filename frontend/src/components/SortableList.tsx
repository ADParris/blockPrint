import React, { Fragment } from 'react';
import DropZone from './DropZone';

interface SortableListProps<T> {
  items: T[];
  onMoveItem: (activeId: string, targetIndex: number) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
}

// 💡 Using a generic <T extends { id: string }> ensures it works with Blocks or Notebooks!
function SortableList<T extends { id: string }>({
  items,
  onMoveItem,
  renderItem,
}: SortableListProps<T>) {
  return (
    <>
      <DropZone index={0} onDropBlock={onMoveItem} />
      {items.map((item, index) => (
        <Fragment key={item.id}>
          {renderItem(item, index)}
          <DropZone index={index + 1} onDropBlock={onMoveItem} />
        </Fragment>
      ))}
    </>
  );
}

export default SortableList;
