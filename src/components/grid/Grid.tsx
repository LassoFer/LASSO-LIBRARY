import { MoveHorizontal } from 'lucide-react';
import React, { type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { AutoSizer, MultiGrid, type MultiGridProps } from 'react-virtualized';

import { classNames } from '../../utils/common';
import NoData from '../nodata/NoData';
import styles from './Grid.module.css';

export type ViewMode = 'view' | 'edit';
export type CellType = 'text' | 'number' | 'date' | 'select' | 'textarea';

export type GridColumn<T> = {
  title: string;
  key?: string;
  name?: string;
  tooltip?: string;
  type?: CellType;
  notEditable?: boolean;
  columnOrder?: number;
  group?: string;
  width?: number;
  headerStyle?: CSSProperties;
  template?: (props: CellParameters<T>) => ReactElement;
};

type InternalGridColumn<T> = GridColumn<T> & {
  __gridInternalType?: 'group';
};

export type CellParameters<T> = {
  viewMode: ViewMode;
  selected: boolean;
  type: CellType;
  column: GridColumn<T>;
  row: T;
  disabled?: boolean;
  value?: unknown;
  onChange?: (nextValue: unknown) => void;
  options?: readonly (string | null)[];
  placeholder?: string;
};

export type GridSizePreset = 'L' | 'M' | 'S';

export type GridSizeConfig = {
  rowHeight: number;
  defaultColumnWidth: number;
  minColumnWidth: number;
  headerFontSize: number;
  bodyFontSize: number;
  headerPaddingY: number;
  headerPaddingX: number;
  cellPaddingX: number;
};

export type GridGroupField<T> = keyof T | string;

export type GridGroupConfig<T> = {
  enabled: boolean;
  groupBy: GridGroupField<T> | GridGroupField<T>[];
  expandedKeys?: string[];
  onExpandedKeysChange?: (keys: string[]) => void;

  groupColumnTitle?: string;
  groupColumnWidth?: number;

  renderGroupTitle?: (params: {
    key: string;
    field: GridGroupField<T>;
    value: unknown;
    rows: T[];
    level: number;
    expanded: boolean;
    hasChildren: boolean;
  }) => ReactNode;

  renderGroupCell?: (params: {
    key: string;
    field: GridGroupField<T>;
    value: unknown;
    rows: T[];
    level: number;
    expanded: boolean;
    column: GridColumn<T>;
    columnIndex: number;
  }) => ReactNode;
};

export type GridProps<T extends Record<string, unknown>> = {
  data: T[];
  setData?: React.Dispatch<React.SetStateAction<T[]>>;
  headerActions?: (column: GridColumn<T>) => ReactNode;
  selectedRows?: number[];
  handleRowOnClick?: (e: React.MouseEvent, rowIndex: number) => void;
  handleRowOnHover?: (e: React.MouseEvent, rowIndex: number) => void;
  columns: GridColumn<T>[];
  viewMode?: ViewMode;
  updateData?: (newValue: unknown, oldRow: T, column: GridColumn<T>, rowIndex: number) => void;
  dateFormat?: string;
  tableSize?: GridSizePreset;
  topHeader?: boolean;
  rowHeight?: number;
  headerHeight?: number;
  onColumnsOrderChange?: (columns: GridColumn<T>[], oldIndex: number, newIndex: number, column: string) => void;
  grouping?: GridGroupConfig<T>;
  autoHeight?: boolean;
  maxAutoHeight?: number;
  fixColumns?: number;
};

type GridRenderRow<T> =
  | {
      type: 'group';
      key: string;
      field: GridGroupField<T>;
      value: unknown;
      rows: T[];
      level: number;
      expanded: boolean;
      hasChildren: boolean;
    }
  | {
      type: 'row';
      row: T;
      rowIndex: number;
      level: number;
    };

function sortByColumnOrder<T>(cols: GridColumn<T>[]): GridColumn<T>[] {
  const usedOrders = new Set(
    cols.map((col) => col.columnOrder).filter((order): order is number => order !== undefined),
  );

  let nextOrder = 0;

  const colsWithOrder = cols.map((col) => {
    if (col.columnOrder !== undefined) {
      return col;
    }

    while (usedOrders.has(nextOrder)) {
      nextOrder++;
    }

    usedOrders.add(nextOrder);

    return {
      ...col,
      columnOrder: nextOrder++,
    };
  });

  return colsWithOrder.sort((a, b) => (a.columnOrder ?? 0) - (b.columnOrder ?? 0));
}

function getHeaderMinColumnWidth<T>(column: GridColumn<T>, sizeConfig: GridSizeConfig) {
  const extraSpace = sizeConfig.headerPaddingX * 2 + 32;

  return Math.max(sizeConfig.minColumnWidth, extraSpace);
}

function getHeaderDefaultColumnWidth<T>(column: GridColumn<T>, sizeConfig: GridSizeConfig) {
  const minWidth = getHeaderMinColumnWidth(column, sizeConfig);
  const resizeBuffer = Math.max(16, sizeConfig.headerPaddingX * 4);

  return Math.max(sizeConfig.defaultColumnWidth, minWidth + resizeBuffer);
}

export const GRID_SIZE_PRESETS: Record<GridSizePreset, GridSizeConfig> = {
  L: {
    rowHeight: 50,
    defaultColumnWidth: 250,
    minColumnWidth: 80,
    headerFontSize: 14,
    bodyFontSize: 13,
    headerPaddingY: 6,
    headerPaddingX: 12,
    cellPaddingX: 6,
  },
  M: {
    rowHeight: 42,
    defaultColumnWidth: 200,
    minColumnWidth: 65,
    headerFontSize: 12,
    bodyFontSize: 12,
    headerPaddingY: 4,
    headerPaddingX: 9,
    cellPaddingX: 5,
  },
  S: {
    rowHeight: 34,
    defaultColumnWidth: 160,
    minColumnWidth: 50,
    headerFontSize: 11,
    bodyFontSize: 11,
    headerPaddingY: 3,
    headerPaddingX: 6,
    cellPaddingX: 3,
  },
};

type GridGroupNode<T> = {
  key: string;
  field: GridGroupField<T>;
  value: unknown;
  rows: Array<{ row: T; rowIndex: number }>;
  children: Map<string, GridGroupNode<T>>;
  level: number;
};

function getGroupFields<T extends Record<string, unknown>>(
  groupBy: GridGroupConfig<T>['groupBy'],
): GridGroupField<T>[] {
  return Array.isArray(groupBy) ? groupBy : [groupBy];
}

function getGroupValue<T extends Record<string, unknown>>(row: T, field: GridGroupField<T>) {
  return row[field as keyof T] ?? 'Sin grupo';
}

function getGroupKey(parentKey: string, field: GridGroupField<unknown>, value: unknown) {
  const fieldKey = String(field);
  const valueKey = String(value ?? 'Sin grupo');

  return parentKey ? `${parentKey}/${valueKey}` : `${valueKey}`;
}

function buildGroupTree<T extends Record<string, unknown>>(
  data: T[],
  groupFields: GridGroupField<T>[],
): Map<string, GridGroupNode<T>> {
  const root = new Map<string, GridGroupNode<T>>();

  data.forEach((row, rowIndex) => {
    let currentLevel = root;
    let parentKey = '';

    groupFields.forEach((field, level) => {
      const value = getGroupValue(row, field);
      const key = getGroupKey(parentKey, field as GridGroupField<unknown>, value);

      let node = currentLevel.get(key);

      if (!node) {
        node = {
          key,
          field,
          value,
          rows: [],
          children: new Map(),
          level,
        };

        currentLevel.set(key, node);
      }

      node.rows.push({ row, rowIndex });

      currentLevel = node.children;
      parentKey = key;
    });
  });

  return root;
}

function flattenGroupTree<T extends Record<string, unknown>>(
  nodes: Map<string, GridGroupNode<T>>,
  expandedKeys: Set<string>,
  groupFieldsLength: number,
): GridRenderRow<T>[] {
  const result: GridRenderRow<T>[] = [];

  nodes.forEach((node) => {
    const expanded = expandedKeys.has(node.key);

    result.push({
      type: 'group',
      key: node.key,
      field: node.field,
      value: node.value,
      rows: node.rows.map((item) => item.row),
      level: node.level,
      expanded,
      hasChildren: node.children.size === 0 ? false : true,
    });

    if (!expanded) return;

    if (node.children.size > 0) {
      result.push(...flattenGroupTree(node.children, expandedKeys, groupFieldsLength));
      return;
    }

    // node.rows.forEach(({ row, rowIndex }) => {
    //   result.push({
    //     type: 'row',
    //     row,
    //     rowIndex,
    //     level: groupFieldsLength,
    //   });
    // });
  });

  return result;
}

function getAllGroupKeys<T>(nodes: Map<string, GridGroupNode<T>>): string[] {
  const keys: string[] = [];

  nodes.forEach((node) => {
    keys.push(node.key);

    if (node.children.size > 0) {
      keys.push(...getAllGroupKeys(node.children));
    }
  });

  return keys;
}

function getGroupLevelColor(level: number, totalLevels: number) {
  const safeTotalLevels = Math.max(totalLevels, 1);
  const safeLevel = Math.min(Math.max(level, 0), safeTotalLevels - 1);

  const maxBrandMix = 18;
  const minBrandMix = 6;

  const ratio = safeTotalLevels === 1 ? 0 : safeLevel / (safeTotalLevels - 1);
  const brandMix = Math.round(maxBrandMix - ratio * (maxBrandMix - minBrandMix));

  return `color-mix(in srgb, var(--color-brand) ${brandMix}%, var(--color-card))`;
}

function GridInner<T extends Record<string, unknown>>({
  data,
  handleRowOnClick = () => {},
  handleRowOnHover = () => {},
  columns,
  viewMode = 'view',
  headerActions,
  updateData,
  tableSize = 'L',
  topHeader = false,
  rowHeight,
  headerHeight,
  autoHeight = false,
  maxAutoHeight,
  onColumnsOrderChange = () => {},
  grouping,
  fixColumns = 0,
}: GridProps<T>) {
  const sizeConfig = GRID_SIZE_PRESETS[tableSize];

  const [columnWidths, setColumnWidths] = React.useState<Record<string, number>>({});
  const [columnsOrder, setColumnsOrder] = React.useState<InternalGridColumn<T>[]>(() => sortByColumnOrder<T>(columns));
  const [editedColumnOrder, setEditedColumnOrder] = React.useState(false);
  const [scrollLeft, setScrollLeft] = React.useState(0);
  const [scrollTop, setScrollTop] = React.useState(0);
  const [internalExpandedGroupKeys, setInternalExpandedGroupKeys] = React.useState<string[]>([]);
  const [draggingColumnTitle, setDraggingColumnTitle] = React.useState<string | null>(null);
  const [dragOverColumnTitle, setDragOverColumnTitle] = React.useState<string | null>(null);

  const gridWidthRef = React.useRef(0);
  const multiGridRef = React.useRef<MultiGrid>(null);
  const previousDefaultColumnWidthRef = React.useRef(sizeConfig.defaultColumnWidth);
  const gridClipRef = React.useRef<HTMLDivElement>(null);

  const dragColumnRef = React.useRef<{
    title: string;
    startX: number;
    hasMoved: boolean;
  } | null>(null);

  React.useEffect(() => {
    setColumnWidths((prev) => {
      const nextWidths: Record<string, number> = {};

      columns.forEach((column) => {
        const minWidth = getHeaderMinColumnWidth(column, sizeConfig);
        const defaultWidth = column.width ?? getHeaderDefaultColumnWidth(column, sizeConfig);
        const currentWidth = prev[column.title];

        nextWidths[column.title] =
          currentWidth === undefined ? Math.max(defaultWidth, minWidth) : Math.max(currentWidth, minWidth);
      });

      return nextWidths;
    });

    if (!editedColumnOrder) {
      setColumnsOrder(sortByColumnOrder(columns));
    }
  }, [columns, editedColumnOrder, sizeConfig]);

  React.useEffect(() => {
    const previousDefaultColumnWidth = previousDefaultColumnWidthRef.current;
    if (previousDefaultColumnWidth === sizeConfig.defaultColumnWidth) return;

    const scaleRatio = sizeConfig.defaultColumnWidth / previousDefaultColumnWidth;

    setColumnWidths((prev) => {
      const nextWidths: Record<string, number> = {};

      columns.forEach((column) => {
        const currentWidth = prev[column.title] ?? column.width ?? getHeaderDefaultColumnWidth(column, sizeConfig);
        const scaledWidth = column.width ?? Math.round(currentWidth * scaleRatio);
        const minWidth = getHeaderMinColumnWidth(column, sizeConfig);

        nextWidths[column.title] = Math.max(minWidth, scaledWidth);
      });

      return nextWidths;
    });

    previousDefaultColumnWidthRef.current = sizeConfig.defaultColumnWidth;
  }, [columns, sizeConfig]);

  const recompute = React.useCallback(() => {
    multiGridRef.current?.recomputeGridSize();
    multiGridRef.current?.forceUpdateGrids();
    multiGridRef.current?.forceUpdate();
  }, []);

  const groupFields = React.useMemo<GridGroupField<T>[]>(() => {
    if (!grouping?.enabled || !grouping.groupBy) return [];
    return getGroupFields(grouping.groupBy);
  }, [grouping?.enabled, grouping?.groupBy]);

  const groupedData = React.useMemo(() => {
    if (!grouping?.enabled || groupFields.length === 0) return null;
    return buildGroupTree(data, groupFields);
  }, [data, grouping?.enabled, groupFields]);

  React.useEffect(() => {
    if (!groupedData || grouping?.expandedKeys) return;

    setInternalExpandedGroupKeys((prev) => {
      if (prev.length > 0) return prev;
      return getAllGroupKeys(groupedData);
    });
  }, [groupedData, grouping?.expandedKeys]);

  const expandedGroupKeys = grouping?.expandedKeys ?? internalExpandedGroupKeys;

  const groupingEnabled = Boolean(grouping?.enabled && groupFields.length > 0);

  const groupColumn = React.useMemo<InternalGridColumn<T> | null>(() => {
    if (!groupingEnabled) return null;

    return {
      title: '__ct_group_column__',
      name: grouping?.groupColumnTitle ?? '',
      width: grouping?.groupColumnWidth ?? 180,
      notEditable: true,
      __gridInternalType: 'group',
    };
  }, [groupingEnabled, grouping?.groupColumnTitle, grouping?.groupColumnWidth]);

  const renderColumns = React.useMemo<InternalGridColumn<T>[]>(() => {
    return groupColumn ? [groupColumn, ...columnsOrder] : columnsOrder;
  }, [groupColumn, columnsOrder]);

  const fixedColumnCount = React.useMemo(() => {
    if (groupingEnabled) return 1;

    return Math.max(0, Math.min(fixColumns, renderColumns.length));
  }, [groupingEnabled, fixColumns, renderColumns.length]);

  React.useEffect(() => {
    if (!groupedData || grouping?.expandedKeys) return;

    setInternalExpandedGroupKeys((prev) => {
      if (prev.length > 0) return prev;
      return Array.from(groupedData.keys());
    });
  }, [groupedData, grouping?.expandedKeys]);

  const toggleGroup = React.useCallback(
    (groupKey: string) => {
      const current = new Set(expandedGroupKeys);

      if (current.has(groupKey)) {
        current.delete(groupKey);
      } else {
        current.add(groupKey);
      }

      const nextKeys = Array.from(current);

      if (grouping?.onExpandedKeysChange) {
        grouping.onExpandedKeysChange(nextKeys);
      } else {
        setInternalExpandedGroupKeys(nextKeys);
      }

      requestAnimationFrame(() => {
        recompute();
      });
    },
    [expandedGroupKeys, grouping, recompute],
  );

  const renderRows = React.useMemo<GridRenderRow<T>[]>(() => {
    if (!groupedData || !grouping?.enabled || groupFields.length === 0) {
      return data.map((row, rowIndex) => ({
        type: 'row',
        row,
        rowIndex,
        level: 0,
      }));
    }

    return flattenGroupTree(groupedData, new Set(expandedGroupKeys), groupFields.length);
  }, [data, groupedData, grouping?.enabled, expandedGroupKeys, groupFields.length]);

  React.useLayoutEffect(() => {
    recompute();
  }, [
    recompute,
    tableSize,
    sizeConfig.rowHeight,
    sizeConfig.defaultColumnWidth,
    columnsOrder.length,
    renderColumns.length,
    data.length,
    renderRows.length,
    groupingEnabled,
    fixedColumnCount,
  ]);

  const headerGroups = React.useMemo(() => {
    const groups: Array<{
      title: string;
      startIndex: number;
      endIndex: number;
    }> = [];

    renderColumns.forEach((column, index) => {
      const groupTitle = column.__gridInternalType === 'group' ? '' : (column.group ?? '');
      const lastGroup = groups[groups.length - 1];

      if (lastGroup && lastGroup.title === groupTitle) {
        lastGroup.endIndex = index;
      } else {
        groups.push({
          title: groupTitle,
          startIndex: index,
          endIndex: index,
        });
      }
    });

    return groups;
  }, [renderColumns]);

  const getHeaderGroupForColumn = React.useCallback(
    (columnIndex: number) => {
      return headerGroups.find((group) => columnIndex >= group.startIndex && columnIndex <= group.endIndex);
    },
    [headerGroups],
  );

  const getColumnWidthByIndex = React.useCallback(
    (index: number) => {
      const column = renderColumns[index];

      // if (column?.__gridInternalType === 'group') {
      //   return column.width ?? grouping?.groupColumnWidth ?? 180;
      // }

      const widthFromState = column ? columnWidths[column.title] : undefined;

      return column
        ? (widthFromState ?? column.width ?? getHeaderDefaultColumnWidth(column, sizeConfig))
        : sizeConfig.defaultColumnWidth;
    },
    [renderColumns, columnWidths, sizeConfig, grouping?.groupColumnWidth],
  );

  function getGroupColor(groupTitle: string) {
    let hash = 0;

    for (let i = 0; i < groupTitle.length; i++) {
      hash = groupTitle.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = Math.abs(hash) % 360;
    const isDarkMode = window.matchMedia?.('(prefers-color-scheme: dark)').matches;

    return isDarkMode ? `hsl(${hue}, 55%, 32%)` : `hsl(${hue}, 65%, 82%)`;
  }

  const handlePointerDownResize = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>, paramName: string) => {
      e.stopPropagation();
      e.preventDefault();
      e.currentTarget.setPointerCapture?.(e.pointerId);

      const column = columnsOrder.find((item) => item.title === paramName);
      const minAllowedWidth = column ? getHeaderMinColumnWidth(column, sizeConfig) : sizeConfig.minColumnWidth;

      const initialX = e.clientX;
      const initialWidth = column
        ? (columnWidths[paramName] ?? getHeaderDefaultColumnWidth(column, sizeConfig))
        : (columnWidths[paramName] ?? sizeConfig.defaultColumnWidth);

      const handlePointerMove = (ev: PointerEvent) => {
        ev.preventDefault();

        const newWidth = initialWidth + (ev.clientX - initialX);

        setColumnWidths((prev) => ({
          ...prev,
          [paramName]: Math.max(minAllowedWidth, newWidth),
        }));

        recompute();
      };

      const handlePointerUp = () => {
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
        document.removeEventListener('pointercancel', handlePointerUp);
      };

      document.addEventListener('pointermove', handlePointerMove, { passive: false });
      document.addEventListener('pointerup', handlePointerUp);
      document.addEventListener('pointercancel', handlePointerUp);
    },
    [columnWidths, columnsOrder, recompute, sizeConfig],
  );

  const getColumnLeftByIndex = React.useCallback(
    (index: number) => {
      let left = 0;

      for (let i = 0; i < index; i++) {
        left += getColumnWidthByIndex(i);
      }

      return left;
    },
    [getColumnWidthByIndex],
  );

  const shouldShowGroupTitleInColumn = React.useCallback(
    (group: { startIndex: number; endIndex: number }, columnIndex: number) => {
      const viewportLeft = scrollLeft;
      const viewportRight = scrollLeft + gridWidthRef.current;

      const groupLeft = getColumnLeftByIndex(group.startIndex);
      const groupRight = getColumnLeftByIndex(group.endIndex) + getColumnWidthByIndex(group.endIndex);

      const visibleLeft = Math.max(groupLeft, viewportLeft);
      const visibleRight = Math.min(groupRight, viewportRight);

      if (visibleLeft >= visibleRight) return false;

      const visibleCenter = (visibleLeft + visibleRight) / 2;

      const columnLeft = getColumnLeftByIndex(columnIndex);
      const columnRight = columnLeft + getColumnWidthByIndex(columnIndex);

      return visibleCenter >= columnLeft && visibleCenter < columnRight;
    },
    [scrollLeft, getColumnLeftByIndex, getColumnWidthByIndex],
  );

  const getColumnIndexFromClientX = React.useCallback(
    (clientX: number) => {
      const gridLeft = gridClipRef.current?.getBoundingClientRect().left ?? 0;
      const localX = clientX - gridLeft + scrollLeft;

      let left = groupingEnabled ? getColumnWidthByIndex(0) : 0;

      for (let i = 0; i < columnsOrder.length; i++) {
        const renderIndex = groupingEnabled ? i + 1 : i;
        const width = getColumnWidthByIndex(renderIndex);
        const right = left + width;

        if (localX >= left && localX <= right) {
          return i;
        }

        left = right;
      }

      return -1;
    },
    [columnsOrder.length, getColumnWidthByIndex, scrollLeft, groupingEnabled],
  );

  const handlePointerDownColumnDrag = React.useCallback(
    (e: React.PointerEvent, title: string) => {
      if ((e.target as HTMLElement).closest(`.${styles.ctResizeHandle}`)) return;

      e.stopPropagation();

      dragColumnRef.current = {
        title,
        startX: e.clientX,
        hasMoved: false,
      };

      setDraggingColumnTitle(title);
      setDragOverColumnTitle(null);

      const handlePointerMove = (ev: PointerEvent) => {
        const dragState = dragColumnRef.current;
        if (!dragState) return;

        const deltaX = Math.abs(ev.clientX - dragState.startX);

        if (deltaX < 8) return;

        ev.preventDefault();
        dragState.hasMoved = true;

        const targetIndex = getColumnIndexFromClientX(ev.clientX);
        if (targetIndex < 0) {
          setDragOverColumnTitle(null);
          return;
        }

        const targetColumn = columnsOrder[targetIndex];

        if (!targetColumn || targetColumn.title === dragState.title) {
          setDragOverColumnTitle(null);
          return;
        }

        recompute();
        setDragOverColumnTitle(targetColumn.title);
      };

      const handlePointerUp = (ev: PointerEvent) => {
        const dragState = dragColumnRef.current;

        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
        document.removeEventListener('pointercancel', handlePointerUp);

        if (!dragState?.hasMoved) {
          dragColumnRef.current = null;
          setDraggingColumnTitle(null);
          setDragOverColumnTitle(null);
          return;
        }

        const oldIndex = columnsOrder.findIndex((column) => column.title === dragState.title);
        const newIndex = getColumnIndexFromClientX(ev.clientX);

        if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
          const next = [...columnsOrder];
          const [moved] = next.splice(oldIndex, 1);

          next.splice(newIndex, 0, moved);

          setColumnsOrder(next);
          setEditedColumnOrder(true);

          requestAnimationFrame(() => {
            recompute();
          });
        }

        if (oldIndex !== newIndex) {
          onColumnsOrderChange(columnsOrder, oldIndex, newIndex, dragColumnRef.current?.title ?? '');
        }

        dragColumnRef.current = null;
        setDraggingColumnTitle(null);
        setDragOverColumnTitle(null);
      };

      document.addEventListener('pointermove', handlePointerMove, { passive: false });
      document.addEventListener('pointerup', handlePointerUp);
      document.addEventListener('pointercancel', handlePointerUp);

      recompute();
    },
    [columnsOrder, getColumnIndexFromClientX, onColumnsOrderChange, recompute],
  );

  const cellRenderer: MultiGridProps['cellRenderer'] = React.useCallback(
    ({ columnIndex, key, rowIndex, style }) => {
      const colToShow = renderColumns[columnIndex];
      if (!colToShow) return null;

      const isInternalGroupColumn = colToShow.__gridInternalType === 'group';
      const colCount = renderColumns.length;

      const isFixedColumn = columnIndex < fixedColumnCount;
      const isFixedHeaderStart = isFixedColumn && columnIndex === 0;
      const isFixedHeaderEnd = isFixedColumn && columnIndex === fixedColumnCount - 1;

      const fixedHeaderClasses = [
        isFixedColumn && styles.ctFixedHeaderCell,
        isFixedHeaderEnd && styles.ctFixedHeaderBoundary,
      ];

      const fixedHeaderTopClasses = [
        ...fixedHeaderClasses,
        isFixedHeaderStart && styles.ctFixedHeaderTopStart,
        isFixedHeaderEnd && styles.ctFixedHeaderTopEnd,
      ];
      let isEven = false;
      let renderRowIndex = 0;

      if (topHeader) {
        if (rowIndex === 0) {
          if (isInternalGroupColumn) return null;

          const group = getHeaderGroupForColumn(columnIndex);

          if (!group) return null;

          const isGroupStart = columnIndex === group.startIndex;
          const isGroupEnd = columnIndex === group.endIndex;
          const shouldShowGroupTitle = shouldShowGroupTitleInColumn(group, columnIndex);

          return (
            <div
              key={key}
              style={{
                ...style,
                zIndex: isFixedColumn ? 4 : 3,
                backgroundColor: getGroupColor(group.title),
              }}
              className={classNames([
                styles.ctGroupHeaderOuter,
                isGroupStart && styles.ctGroupHeaderStart,
                isGroupEnd && styles.ctGroupHeaderEnd,
                ...fixedHeaderTopClasses,
              ])}
            >
              <div className={styles.ctGroupHeaderCell}>
                {shouldShowGroupTitle ? group.title.toLocaleUpperCase() || '\u00A0' : '\u00A0'}
              </div>
            </div>
          );
        }

        if (rowIndex === 1) {
          const isDragging = draggingColumnTitle === colToShow.title;
          const isOver = dragOverColumnTitle === colToShow.title;

          // if (isInternalGroupColumn) return <div key={key}></div>;
          return (
            <div
              key={key}
              style={{ ...style, display: 'flex', flexDirection: 'column' }}
              className={classNames([styles.ctHeaderCellOuter, ...fixedHeaderClasses])}
              onPointerDown={(e) => handlePointerDownColumnDrag(e, colToShow.title)}
            >
              <div
                className={classNames([
                  !isInternalGroupColumn && styles.ctHeaderCellContainer,
                  isDragging && styles.ctHeaderCellDragging,
                  isOver && styles.ctHeaderCellOver,
                  isInternalGroupColumn && styles.ctInternalGroupHeader,
                ])}
                style={colToShow.headerStyle}
              >
                <div
                  className={classNames([
                    styles.ctHeaderTextContainer,
                    isInternalGroupColumn && styles.ctInternalGroupHeader,
                  ])}
                >
                  {!isInternalGroupColumn && headerActions && headerActions(colToShow)}
                  <div className={styles.ctHeaderText}>{colToShow.name ?? colToShow.title}</div>
                  <div
                    className={classNames([styles.ctResizeHandle])}
                    onPointerDown={(e) => handlePointerDownResize(e, colToShow.title)}
                  >
                    <MoveHorizontal size={12} />
                  </div>
                </div>
              </div>
            </div>
          );
        }

        isEven = rowIndex % 2 === 0;
        renderRowIndex = rowIndex - 2;
      } else {
        if (rowIndex === 0) {
          const isDragging = draggingColumnTitle === colToShow.title;
          const isOver = dragOverColumnTitle === colToShow.title;

          return (
            <div
              key={key}
              style={{
                ...style,
                display: 'flex',
                flexDirection: 'column',
              }}
              className={classNames([styles.ctHeaderCellOuter, ...fixedHeaderTopClasses])}
              onPointerDown={(e) => handlePointerDownColumnDrag(e, colToShow.title)}
            >
              <div
                className={classNames([
                  styles.ctHeaderCellContainer,
                  isDragging && styles.ctHeaderCellDragging,
                  isOver && styles.ctHeaderCellOver,
                ])}
                style={{
                  ...colToShow.headerStyle,
                }}
              >
                <div className={classNames([styles.ctHeaderTextContainer])}>
                  {!isInternalGroupColumn && headerActions && headerActions(colToShow)}
                  <div className={styles.ctHeaderText}>{colToShow.name ?? colToShow.title}</div>
                  <div
                    className={classNames([styles.ctResizeHandle])}
                    onPointerDown={(e) => handlePointerDownResize(e, colToShow.title)}
                  >
                    <MoveHorizontal size={12} />
                  </div>
                </div>
              </div>
            </div>
          );
        }

        isEven = rowIndex % 2 === 0;
        renderRowIndex = rowIndex - 1;
      }

      const renderRow = renderRows[renderRowIndex];

      if (!renderRow) return null;

      if (renderRow.type === 'group') {
        const isGroupColumn = colToShow.__gridInternalType === 'group';

        const title = grouping?.renderGroupTitle?.({
          key: renderRow.key,
          field: renderRow.field,
          value: renderRow.value,
          rows: renderRow.rows,
          level: renderRow.level,
          expanded: renderRow.expanded,
          hasChildren: renderRow.hasChildren,
        }) ?? (
          <>
            <span className={styles.ctGroupRowChevron}>{renderRow.expanded ? '▾' : '▸'}</span>
            <span className={styles.ctGroupRowTitle}>{String(renderRow.value)}</span>
            <span className={styles.ctGroupRowCount}>({renderRow.rows.length})</span>
          </>
        );

        const groupLevelColor = getGroupLevelColor(renderRow.level, groupFields.length);

        return (
          <div
            key={key}
            style={{
              ...style,
              backgroundColor: groupLevelColor,
            }}
            className={classNames([
              styles.ctGroupRowOuter,
              isGroupColumn && styles.ctGroupRowFixedCell,
              !isGroupColumn && styles.ctGroupRowValueCell,
            ])}
            onClick={(e) => {
              e.stopPropagation();

              if (isGroupColumn) {
                toggleGroup(renderRow.key);
              }
            }}
          >
            <div
              className={styles.ctGroupRowCellInner}
              style={{
                paddingLeft: isGroupColumn ? `${renderRow.level * 10}px` : undefined,
                backgroundColor: groupLevelColor,
              }}
            >
              {isGroupColumn
                ? title
                : grouping?.renderGroupCell?.({
                    key: renderRow.key,
                    field: renderRow.field,
                    value: renderRow.value,
                    rows: renderRow.rows,
                    level: renderRow.level,
                    expanded: renderRow.expanded,
                    column: colToShow,
                    columnIndex: columnIndex - 1,
                  })}
            </div>
          </div>
        );
      }

      const row = renderRow.row;
      const realRowIndex = renderRow.rowIndex;
      const selected = false;

      if (colToShow.__gridInternalType === 'group') {
        // return <div key={key}></div>;
        return (
          <div
            key={key}
            style={style}
            className={classNames([styles.ctCellOuter, isEven && styles.ctRowEven])}
            onClick={(e) => handleRowOnClick(e, realRowIndex)}
            onMouseOver={(e) => handleRowOnHover(e, realRowIndex)}
          >
            <div
              className={classNames([
                styles.ctBodyCell,
                styles.ctBodyCellGrouped,
                viewMode === 'edit' ? styles.ctBodyCellEditing : styles.ctBodyCellView,
              ])}
              style={{
                paddingLeft:
                  renderRow.level > 0 ? `calc(var(--ct-cell-padding-x) + ${renderRow.level * 10}px)` : undefined,
              }}
            />
          </div>
        );
      }
      const cellValue = colToShow.key ? row[colToShow.key as keyof T] : undefined;

      return (
        <div
          key={key}
          style={style}
          className={classNames([styles.ctCellOuter, isEven && styles.ctRowEven])}
          onClick={(e) => handleRowOnClick(e, realRowIndex)}
          onMouseOver={(e) => handleRowOnHover(e, realRowIndex)}
        >
          <div
            className={classNames([
              styles.ctBodyCell,
              viewMode === 'edit' ? styles.ctBodyCellEditing : styles.ctBodyCellView,
            ])}
            style={{
              borderRight: columnIndex === colCount - 1 ? 'none' : undefined,
            }}
          >
            {colToShow.template ? (
              colToShow.template({
                column: colToShow,
                selected,
                type: colToShow.type ?? 'text',
                row,
                value: cellValue,
                viewMode,
                disabled: colToShow.notEditable,
                onChange: (nextValue: unknown) => {
                  updateData?.(nextValue, row, colToShow, realRowIndex);
                },
              })
            ) : (
              <div>{String(cellValue ?? '')}</div>
            )}
          </div>
        </div>
      );
    },
    [
      columnsOrder,
      topHeader,
      getHeaderGroupForColumn,
      shouldShowGroupTitleInColumn,
      draggingColumnTitle,
      dragOverColumnTitle,
      handlePointerDownColumnDrag,
      headerActions,
      handlePointerDownResize,
      renderRows,
      grouping,
      toggleGroup,
      viewMode,
      updateData,
      handleRowOnClick,
      handleRowOnHover,
      fixedColumnCount,
    ],
  );

  const gridStyle = React.useMemo(
    () =>
      ({
        '--ct-header-font-size': `${sizeConfig.headerFontSize}px`,
        '--ct-body-font-size': `${sizeConfig.bodyFontSize}px`,
        '--ct-header-padding-y': `${sizeConfig.headerPaddingY}px`,
        '--ct-header-padding-x': `${sizeConfig.headerPaddingX}px`,
        '--ct-cell-padding-x': `${sizeConfig.cellPaddingX}px`,
      }) as React.CSSProperties,
    [sizeConfig],
  );

  const getGridRowHeight = React.useCallback(
    (index: number) => {
      if ((!topHeader && index === 0 && headerHeight) || (topHeader && index === 1 && headerHeight)) {
        return headerHeight;
      }

      if (index === 0) return Math.round(sizeConfig.rowHeight * 0.75);
      if (topHeader && index === 1) return Math.round(sizeConfig.rowHeight * 0.75);

      return rowHeight ?? sizeConfig.rowHeight;
    },
    [topHeader, headerHeight, rowHeight, sizeConfig.rowHeight],
  );

  const totalRowCount = topHeader ? renderRows.length + 2 : renderRows.length + 1;

  const contentHeight = React.useMemo(() => {
    let total = 0;

    for (let index = 0; index < totalRowCount; index++) {
      total += getGridRowHeight(index);
    }

    return total;
  }, [totalRowCount, getGridRowHeight]);

  const renderTable = () => {
    return (
      <div className={styles.ctTableContainer}>
        <AutoSizer style={{ flex: 1, width: '100%', display: 'flex', justifyContent: 'center' }}>
          {({ width, height }) => {
            const availableHeight = maxAutoHeight ? Math.min(height, maxAutoHeight) : height;
            const gridHeight = autoHeight ? Math.min(contentHeight + 10, availableHeight) : availableHeight;
            const gridViewportWidth = Math.max(0, width);

            gridWidthRef.current = gridViewportWidth;

            return (
              <div
                ref={gridClipRef}
                className={styles.ctGridClip}
                style={{
                  width: gridViewportWidth,
                  height: gridHeight,
                  maxHeight: availableHeight,
                }}
              >
                <MultiGrid
                  ref={multiGridRef}
                  scrollToAlignment="auto"
                  enableFixedColumnScroll
                  enableFixedRowScroll
                  width={gridViewportWidth}
                  height={gridHeight}
                  rowHeight={({ index }) => getGridRowHeight(index)}
                  columnWidth={({ index }) => getColumnWidthByIndex(index)}
                  fixedRowCount={topHeader ? 2 : 1}
                  fixedColumnCount={fixedColumnCount}
                  rowCount={totalRowCount}
                  columnCount={renderColumns.length}
                  overscanRowCount={3}
                  overscanColumnCount={3}
                  cellRenderer={cellRenderer}
                  onScroll={({ scrollLeft, scrollTop }) => {
                    setScrollLeft(scrollLeft ?? 0);
                    setScrollTop(scrollTop ?? 0);
                  }}
                  classNameTopLeftGrid={styles.ctGridRendererCornerTopLeft}
                  classNameTopRightGrid={styles.ctGridRendererCornerTop}
                  classNameBottomRightGrid={styles.ctGridRendererCornerBottom}
                  classNameBottomLeftGrid={styles.ctGridRendererConerBottomLeft}
                  className={styles.ctGridRenderer}
                  styleTopLeftGrid={{
                    overflow: 'hidden',
                  }}
                  styleTopRightGrid={{
                    overflowX: 'hidden',
                    overflowY: 'hidden',
                  }}
                  styleBottomLeftGrid={{
                    overflowX: 'hidden',
                    overflowY: 'hidden',
                  }}
                  styleBottomRightGrid={{
                    overflowX: 'auto',
                    overflowY: 'auto',
                  }}
                />
              </div>
            );
          }}
        </AutoSizer>
      </div>
    );
  };

  return (
    <div
      className={styles.ctWrap}
      style={gridStyle}
      onWheel={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {data.length !== 0 && columnsOrder.length !== 0 && Object.keys(columnWidths).length !== 0 ? (
        <div className={styles.ctTable}>{renderTable()}</div>
      ) : data.length === 0 ? (
        <NoData title="No data" />
      ) : columnsOrder.length === 0 ? (
        <NoData title="No columns available" />
      ) : (
        <NoData title="No data" />
      )}
    </div>
  );
}

export const Grid = React.memo(
  GridInner,
  (prev, next) =>
    prev.data === next.data &&
    prev.selectedRows === next.selectedRows &&
    prev.columns === next.columns &&
    prev.viewMode === next.viewMode &&
    prev.headerActions === next.headerActions &&
    prev.tableSize === next.tableSize &&
    prev.topHeader === next.topHeader &&
    prev.rowHeight === next.rowHeight &&
    prev.headerHeight === next.headerHeight &&
    prev.autoHeight === next.autoHeight &&
    prev.maxAutoHeight === next.maxAutoHeight &&
    prev.fixColumns === next.fixColumns &&
    prev.grouping === next.grouping,
) as typeof GridInner;

export default Grid;
