import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Check } from 'lucide-react';
import Button from '../button/button';
import styles from './DraggableList.module.css';
import type { DraggableItemData, FastSetterMap } from './DraggableSelector';

type DragLocation = 0 | { x: number; y: number };

type ItemProps = {
  item: DraggableItemData;
  isDragging?: boolean;
  isActive?: boolean;
};

export function Item({ item }: ItemProps) {
  return item.children(item);
}

type SortableItemProps = {
  item: DraggableItemData;
  isDragging: boolean;
  isActive: boolean;
  dragLocation?: DragLocation;
  scale?: number;
  hideDraggedItem?: boolean;
  fastSetter?: FastSetterMap;
  setFastSetter?: React.Dispatch<React.SetStateAction<FastSetterMap | undefined>>;
  containerKey?: string;
};

export default function SortableItem({
  isDragging,
  isActive,
  item,
  scale,
  hideDraggedItem,
  fastSetter,
  setFastSetter,
  containerKey,
}: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.id,
  });

  const transformValue = CSS.Transform.toString(transform);

  const isSelected =
    Boolean(containerKey) &&
    Boolean(fastSetter?.[containerKey as string]?.selectedValues?.some((selectedItem) => selectedItem.id === item.id));

  const className = isDragging
    ? `${styles.draggingItem} ${styles.overlay}`
    : isActive
      ? `${styles.draggableItem} ${styles.active}`
      : styles.draggableItem;

  const removePointers: React.HTMLAttributes<HTMLDivElement> = {
    onPointerDown: (event) => {
      event.stopPropagation();
      event.preventDefault();
    },
    onPointerUp: (event) => {
      event.stopPropagation();
      event.preventDefault();
    },
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: scale ? `${transformValue} scale(${scale})` : transformValue,
        transition,
        opacity: hideDraggedItem && isActive ? 0 : 1,
      }}
      {...attributes}
      {...listeners}
      className={`${className} ${isSelected ? styles.selected : ''}`}
    >
      <Item item={item} isDragging={isDragging} isActive={isActive} />

      {!isDragging && fastSetter && setFastSetter && containerKey && (
        <div {...removePointers}>
          <Button
            onClick={() => {
              setFastSetter((prev) => {
                if (!prev) return prev;

                const selectedValues = prev[containerKey]?.selectedValues ?? [];
                const alreadySelected = selectedValues.some((selectedItem) => selectedItem.id === item.id);

                return {
                  ...prev,
                  [containerKey]: {
                    ...prev[containerKey],
                    selectedValues: alreadySelected
                      ? selectedValues.filter((selectedItem) => selectedItem.id !== item.id)
                      : [...selectedValues, item],
                  },
                };
              });
            }}
            tooltip="Selecciona un elemento"
          >
            <Check size={11} />
          </Button>
        </div>
      )}
    </div>
  );
}
