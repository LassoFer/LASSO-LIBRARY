import {
  closestCenter,
  closestCorners,
  rectIntersection,
  type Collision,
  type CollisionDetection,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

import type { DraggableItemData, DraggableItemsMap } from './DraggableSelector';

type DragLocation = 0 | { x: number; y: number };

type CardLocation = {
  x: number;
  y: number;
};

type ScrollOffsets = Record<string, { scrollTop: number }>;

type SetItems = React.Dispatch<React.SetStateAction<DraggableItemsMap>>;

type SetDragLocation = React.Dispatch<React.SetStateAction<DragLocation>>;

type SetDraggedItem = React.Dispatch<React.SetStateAction<DraggableItemData | null>>;

type SetScrollOffsets = React.Dispatch<React.SetStateAction<ScrollOffsets>>;

export function handleDragStart(
  event: DragStartEvent,
  items: DraggableItemsMap,
  _scrollOffsets: ScrollOffsets,
  setDraggedItem: SetDraggedItem,
) {
  const { active } = event;
  setDraggedItem(findActiveItem(active.id, items));
}

export function handleDragMove(
  event: DragMoveEvent,
  setDragLocation: SetDragLocation,
  cardLocation: CardLocation,
  scale: number,
) {
  const { delta, over } = event;

  if (!over) return;

  setDragLocation({
    x: (delta.x - cardLocation.x) * scale,
    y: (delta.y - cardLocation.y) * scale,
  });
}

export function handleDragOver(event: DragOverEvent, items: DraggableItemsMap, setItems: SetItems) {
  const { active, over } = event;

  if (!over) return;

  const activeId = active.id;
  const overId = over.id;

  const newActiveContainer = findContainer(activeId, items);
  const newOverContainer = findContainer(overId, items);

  if (!newActiveContainer || !newOverContainer || newActiveContainer === newOverContainer) return;

  setItems((prev) => {
    const activeItems = prev[newActiveContainer];
    const overItems = prev[newOverContainer];

    const activeIndex = activeItems.findIndex((item) => item.id === activeId);
    const overIndex = overItems.findIndex((item) => item.id === overId);

    if (activeIndex < 0) return prev;

    let newIndex: number;

    if (overId in prev) {
      newIndex = overItems.length;
    } else {
      const isBelowLastItem = overIndex === overItems.length - 1;
      const modifier = isBelowLastItem ? 1 : 0;
      newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length;
    }

    const activeItem = activeItems[activeIndex];

    return {
      ...prev,
      [newActiveContainer]: activeItems.filter((item) => item.id !== activeId),
      [newOverContainer]: [...overItems.slice(0, newIndex), activeItem, ...overItems.slice(newIndex)],
    };
  });
}

export function handleDragEnd(
  event: DragEndEvent,
  items: DraggableItemsMap,
  setItems: SetItems,
  setDragLocation: SetDragLocation,
  setDraggedItem: SetDraggedItem,
  setControlSettings: (items: DraggableItemsMap) => void,
) {
  setDragLocation(0);

  const { active, over } = event;

  if (!over) {
    setDraggedItem(null);
    return;
  }

  const activeId = active.id;
  const overId = over.id;

  const activeContainer = findContainer(activeId, items);
  const overContainer = findContainer(overId, items);

  if (!activeContainer || !overContainer || activeContainer !== overContainer) {
    setDraggedItem(null);
    return;
  }

  const activeIndex = items[activeContainer].findIndex((item) => item.id === activeId);
  const overIndex = items[overContainer].findIndex((item) => item.id === overId);

  if (activeIndex < 0 || overIndex < 0) {
    setDraggedItem(null);
    return;
  }

  const updatedContainer = {
    [overContainer]: arrayMove(items[overContainer], activeIndex, overIndex),
  };

  const nextItems = {
    ...items,
    ...updatedContainer,
  };

  if (activeIndex !== overIndex) {
    setItems(nextItems);
  }

  setControlSettings(nextItems);
  setDraggedItem(null);
}

export const findActiveItem = (id: UniqueIdentifier, items: DraggableItemsMap): DraggableItemData | null => {
  for (const key in items) {
    const foundItem = items[key].find((item) => item.id === id);
    if (foundItem) return foundItem;
  }

  return null;
};

export const findContainer = (id: UniqueIdentifier, items: DraggableItemsMap): string | undefined => {
  if (id in items) return String(id);

  return Object.keys(items).find((key) => items[key].some((item) => item.id === id));
};

export function getAdjustedDragLocation(
  cardLocation: CardLocation,
  dragLocation: DragLocation,
  scrollOffsets: ScrollOffsets,
  startScroll: number,
  overContainer: string,
) {
  const overOffset = scrollOffsets[overContainer] ?? {
    scrollTop: 0,
  };

  if (dragLocation === 0) {
    return {
      x: -cardLocation.x,
      y: -cardLocation.y,
    };
  }

  return {
    x: dragLocation.x,
    y: dragLocation.y + startScroll - overOffset.scrollTop,
  };
}

export const handleScroll = (listId: string, setScrollOffsets: SetScrollOffsets) => {
  const listElement = document.getElementById(listId);

  if (!listElement) return;

  setScrollOffsets((prev) => ({
    ...prev,
    [listId]: {
      scrollTop: listElement.scrollTop,
    },
  }));
};

export const customCollisionDetection = (
  args: Parameters<CollisionDetection>[0],
  cardLocation: CardLocation,
): Collision[] => {
  const { droppableContainers, active, collisionRect } = args;

  if (!active || !droppableContainers.length) {
    return [];
  }

  const { x, y } = cardLocation;

  const adjustedDroppableContainers = droppableContainers
    .filter((container) => container.rect.current)
    .map((container) => {
      const rect = container.rect.current!;

      return {
        ...container,
        rect: {
          ...rect,
          top: rect.top - y,
          bottom: rect.bottom - y,
          left: rect.left - x,
          right: rect.right - x,
        },
      };
    });

  const cornerCollision = closestCorners({
    ...args,
    collisionRect,
    droppableContainers: adjustedDroppableContainers,
  });

  if (cornerCollision.length > 0) return cornerCollision;

  const centerCollision = closestCenter({
    ...args,
    collisionRect,
    droppableContainers: adjustedDroppableContainers,
  });

  if (centerCollision.length > 0) return centerCollision;

  const rectCollision = rectIntersection({
    ...args,
    collisionRect,
    droppableContainers: adjustedDroppableContainers,
  });

  return rectCollision.length > 0 ? rectCollision : [];
};
