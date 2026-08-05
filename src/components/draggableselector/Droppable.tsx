import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import SortableItem from './Draggable';
import styles from './DraggableList.module.css';
import type { DraggableItemData, FastSetterMap } from './DraggableSelector';

type DragLocation = 0 | { x: number; y: number };

type DroppableProps = {
  id: string;
  items: DraggableItemData[];
  sortableItems: Array<string | number>;
  draggedItem: DraggableItemData | null;
  dragLocation: DragLocation;
  hideDraggedItem?: boolean;
  fastSetter?: FastSetterMap;
  setFastSetter?: React.Dispatch<React.SetStateAction<FastSetterMap | undefined>>;
  containerKey: string;
};

export default function Droppable({
  id,
  items,
  sortableItems,
  draggedItem,
  dragLocation,
  hideDraggedItem,
  fastSetter,
  setFastSetter,
  containerKey,
}: DroppableProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <SortableContext id={id} items={sortableItems} strategy={verticalListSortingStrategy}>
      <div ref={setNodeRef} id={id} className={styles.sortableContainer}>
        {items.map((item, index) => {
          if (item.hidden) return null;

          return (
            <SortableItem
              hideDraggedItem={hideDraggedItem}
              key={item.key ?? item.id ?? index}
              item={item}
              isDragging={false}
              isActive={draggedItem !== null && draggedItem.id === item.id}
              dragLocation={dragLocation}
              fastSetter={fastSetter}
              setFastSetter={setFastSetter}
              containerKey={containerKey}
            />
          );
        })}
      </div>
    </SortableContext>
  );
}
