import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import styles from './DraggableList.module.css';

import { SwitchComponent } from '@syncfusion/ej2-react-buttons';
import { ArrowRight } from 'lucide-react';
import Button from '../button/button';
import Input from '../input/input';
import SortableItem from './Draggable';
import {
  customCollisionDetection,
  handleDragEnd,
  handleDragMove,
  handleDragOver,
  handleDragStart,
  handleScroll,
} from './DraggableSelectorMethods';
import Droppable from './Droppable';

export type DraggableItemData = {
  id: string | number;
  key?: string;
  hidden?: boolean;
  children: (item: DraggableItemData) => React.ReactNode;
  [key: string]: unknown;
};

export type DraggableItemsMap = Record<string, DraggableItemData[]>;

export type FastSetterConfig = {
  target: string;
  tooltipText?: string;
  selectedValues?: DraggableItemData[];
  [key: string]: unknown;
};

export type FastSetterMap = Record<string, FastSetterConfig>;

type DragLocation = 0 | { x: number; y: number };

type CardLocation = {
  x: number;
  y: number;
};

type ScrollOffsets = Record<string, { scrollTop: number }>;

type DraggableSelectorProps = {
  sourceItems: DraggableItemsMap;
  setControlSettings: (items: DraggableItemsMap) => void;
  removeTitles?: boolean;
  popUpClassName?: string;
  scale?: number;
  subChildren?: (key: string) => React.ReactNode;
  hideDraggedItem?: boolean;
  fastSetter?: FastSetterMap;
  search?: boolean;
};

export default function DraggableSelector({
  sourceItems,
  setControlSettings,
  removeTitles,
  scale = 1,
  subChildren,
  hideDraggedItem = false,
  fastSetter,
  search,
}: DraggableSelectorProps) {
  const [dragLocation, setDragLocation] = useState<DragLocation>(0);
  const [cardLocation, setCardLocation] = useState<CardLocation>({ x: 0, y: 0 });

  const [draggedItem, setDraggedItem] = useState<DraggableItemData | null>(null);
  const [items, setItems] = useState<DraggableItemsMap>({ ...sourceItems });
  const [scrollOffsets, setScrollOffsets] = useState<ScrollOffsets>({});
  const [searchValues, setSearchValues] = useState<Record<string, string>>({});

  const [fastSetterState, setFastSetterState] = useState<FastSetterMap | undefined>(() => {
    if (!fastSetter) return undefined;

    return Object.fromEntries(
      Object.entries(fastSetter).map(([key, value]) => [
        key,
        {
          ...value,
          selectedValues: [],
        },
      ]),
    );
  });

  useEffect(() => {
    const nextItems: DraggableItemsMap = Object.fromEntries(
      Object.entries(sourceItems).map(([key, array]) => {
        const searchValue = searchValues[key];

        if (!searchValue) return [key, array];

        return [
          key,
          array.map((item) => ({
            ...item,
            hidden: !item.key?.toLowerCase().includes(searchValue),
          })),
        ];
      }),
    );

    setItems(nextItems);
  }, [sourceItems, searchValues]);

  useEffect(() => {
    const droppables = document.getElementsByClassName(styles.sortableContainer);
    const nextOffsets: ScrollOffsets = {};

    for (let i = 0; i < droppables.length; i += 1) {
      const element = droppables[i] as HTMLElement;
      nextOffsets[element.id] = { scrollTop: element.scrollTop };
    }

    setScrollOffsets(nextOffsets);
  }, []);

  useEffect(() => {
    const cleanupCallbacks: Array<() => void> = [];

    Object.keys(items).forEach((key) => {
      const element = document.getElementById(key);
      if (!element) return;

      const listener = () => handleScroll(key, setScrollOffsets);
      element.addEventListener('scroll', listener);

      cleanupCallbacks.push(() => {
        element.removeEventListener('scroll', listener);
      });
    });

    return () => {
      cleanupCallbacks.forEach((cleanup) => cleanup());
    };
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const itemIdsByContainer = useMemo(
    () => Object.fromEntries(Object.entries(items).map(([key, value]) => [key, value.map((item) => item.id)])),
    [items],
  );

  const renderHeader = useCallback(
    (title: string, count: number) => {
      const fastSetterValue = fastSetterState?.[title];

      return (
        <div className={styles.headerContainer}>
          <div className={styles.fastSetterHeader}>
            <div className={styles.droppableTitle}>{title}</div>

            {search && (
              <Input
                size="S"
                type="text"
                placeholder="Search..."
                value={searchValues[title] ?? ''}
                onChange={(event) => {
                  const value = event.toString();

                  setSearchValues((prev) => ({
                    ...prev,
                    [title]: value,
                  }));
                }}
              />
            )}
          </div>

          {fastSetterValue && (
            <div className={styles.fastSetterHeader}>
              <SwitchComponent
                key={fastSetterValue.selectedValues?.length ?? 0}
                checked={
                  Boolean(fastSetterValue.selectedValues?.length) &&
                  fastSetterValue.selectedValues?.length === items[title]?.length &&
                  items[title]?.length > 0
                }
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setFastSetterState((prev) => {
                    if (!prev) return prev;

                    return {
                      ...prev,
                      [title]: {
                        ...prev[title],
                        selectedValues: event.target.checked ? [...items[title]] : [],
                      },
                    };
                  });
                }}
              />

              <Button
                onClick={() => {
                  if (!fastSetterValue.selectedValues?.length) return;

                  const selectedValues = fastSetterValue.selectedValues;
                  const target = fastSetterValue.target;

                  const nextItems: DraggableItemsMap = {
                    ...items,
                    [title]: items[title].filter(
                      (item) => !selectedValues.some((selectedItem) => selectedItem.id === item.id),
                    ),
                    [target]: [...(items[target] ?? []), ...selectedValues],
                  };

                  const nextFastSetterState = fastSetterState
                    ? Object.fromEntries(
                        Object.entries(fastSetterState).map(([key, value]) => [
                          key,
                          {
                            ...value,
                            selectedValues: [],
                          },
                        ]),
                      )
                    : undefined;

                  setItems(nextItems);
                  setFastSetterState(nextFastSetterState);
                  setControlSettings(nextItems);
                }}
                tooltip={fastSetterValue.tooltipText}
              >
                <ArrowRight size={11} />
              </Button>
            </div>
          )}
        </div>
      );
    },
    [fastSetterState, items, searchValues, setControlSettings],
  );

  return (
    <div className={styles.draggableSelector} onMouseDown={(event) => event.stopPropagation()}>
      <DndContext
        sensors={sensors}
        autoScroll
        collisionDetection={(args) => customCollisionDetection(args, cardLocation)}
        onDragMove={(event: DragMoveEvent) => handleDragMove(event, setDragLocation, cardLocation, scale)}
        onDragStart={(event: DragStartEvent) => handleDragStart(event, items, scrollOffsets, setDraggedItem)}
        onDragOver={(event: DragOverEvent) => handleDragOver(event, items, setItems)}
        onDragEnd={(event: DragEndEvent) =>
          handleDragEnd(event, items, setItems, setDragLocation, setDraggedItem, setControlSettings)
        }
      >
        {Object.entries(items).map(([key, array]) => (
          <div key={key} className={styles.draggableColumnsContainer}>
            {!removeTitles && renderHeader(key, array.length)}
            <Droppable
              id={key}
              items={array}
              sortableItems={itemIdsByContainer[key]}
              draggedItem={draggedItem}
              dragLocation={dragLocation}
              hideDraggedItem={hideDraggedItem}
              fastSetter={fastSetterState}
              setFastSetter={setFastSetterState}
              containerKey={key}
            />
            {subChildren?.(key)}
          </div>
        ))}

        {createPortal(
          <DragOverlay zIndex={999999}>
            <div style={{ transform: `scale(${scale})` }}>
              {draggedItem && (
                <SortableItem
                  key={draggedItem.key ?? draggedItem.id}
                  item={draggedItem}
                  isDragging
                  isActive={false}
                  dragLocation={dragLocation}
                  scale={scale}
                />
              )}
            </div>
          </DragOverlay>,
          document.body,
        )}
      </DndContext>
    </div>
  );
}
