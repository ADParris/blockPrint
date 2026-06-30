import type { GenericKanbanItem } from '../state/types';

interface ReorderParams<T extends GenericKanbanItem> {
  items: T[];
  itemId: string;
  targetColumnId: string;
  targetIndex: number;
}

export function reorderKanbanItems<T extends GenericKanbanItem>({
  items,
  itemId,
  targetColumnId,
  targetIndex,
}: ReorderParams<T>): T[] {
  const targetItem = items.find((item) => item.id === itemId);
  if (!targetItem) return items;

  const oldColumnId = targetItem.kanban?.columnId || 'Pending';

  // 1. Separate the target lane layout from other items
  const unaffectedItems = items.filter(
    (item) =>
      (item.kanban?.columnId || 'Pending') !== targetColumnId &&
      item.id !== itemId,
  );

  const targetColumnItems = items
    .filter(
      (item) =>
        (item.kanban?.columnId || 'Pending') === targetColumnId &&
        item.id !== itemId,
    )
    .sort((a, b) => (a.kanban?.orderIndex || 0) - (b.kanban?.orderIndex || 0));

  // 2. Prepare the modified item package
  const updatedItem = {
    ...targetItem,
    kanban: {
      columnId: targetColumnId,
      orderIndex: targetIndex,
    },
  };

  // 3. Inject it straight into the sequence array position
  targetColumnItems.splice(targetIndex, 0, updatedItem);

  // 4. Re-index sequence indexes across the altered lane
  const indexedTargetItems = targetColumnItems.map((item, index) => ({
    ...item,
    kanban: {
      ...(item.kanban || { columnId: targetColumnId }),
      orderIndex: index,
    },
  }));

  // 5. Clean up indices on the source column lane if item jumped columns completely
  let finalItemsList = [...unaffectedItems, ...indexedTargetItems];
  if (oldColumnId !== targetColumnId) {
    const sourceColumnItems = finalItemsList
      .filter((item) => (item.kanban?.columnId || 'Pending') === oldColumnId)
      .sort((a, b) => (a.kanban?.orderIndex || 0) - (b.kanban?.orderIndex || 0))
      .map((item, index) => ({
        ...item,
        kanban: {
          ...(item.kanban || { columnId: oldColumnId }),
          orderIndex: index,
        },
      }));

    const restOfItems = finalItemsList.filter(
      (item) => (item.kanban?.columnId || 'Pending') !== oldColumnId,
    );
    finalItemsList = [...restOfItems, ...sourceColumnItems];
  }

  return finalItemsList;
}
