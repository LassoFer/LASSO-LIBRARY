import { ChevronDown, ChevronRight } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import Button from '../button/button';
import Input from '../input/input';
import styles from './TreeCheckboxSelector.module.css';

type Primitive = string | number;

export type TreeNode<T = unknown> = {
  id: string;
  label: string;
  value: string;
  level: number;
  path: string[];
  sourceItems: T[];
  children: TreeNode<T>[];
};

type TreeCheckboxSelectorProps<T> = {
  items: T[];

  /**
   * Opción 1: pasar campos por los que agrupar.
   * Ej: ['category_level_1', 'category_level_2', 'category_level_3']
   */
  groupBy?: Array<keyof T>;

  /**
   * Opción 2: función custom que devuelve los niveles.
   * Tiene prioridad sobre groupBy.
   */
  getPath?: (item: T) => Array<Primitive | null | undefined>;

  value?: string[];
  defaultValue?: string[];
  onChange?: (nextValue: string[], nodes: TreeNode<T>[]) => void;

  searchable?: boolean;
  placeholder?: string;
  emptyText?: string;

  autoExpandSearchResults?: boolean;

  className?: string;

  renderNode?: (node: TreeNode<T>, state: TreeNodeRenderState) => React.ReactNode;
};

type TreeNodeRenderState = {
  checked: boolean;
  indeterminate: boolean;
  expanded: boolean;
  hasChildren: boolean;
};

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function defaultNodeId(path: string[]) {
  return path.join(' > ');
}

function getItemPath<T>(item: T, groupBy?: Array<keyof T>, getPath?: TreeCheckboxSelectorProps<T>['getPath']) {
  const rawPath = getPath ? getPath(item) : (groupBy?.map((key) => item[key] as Primitive | null | undefined) ?? []);

  return rawPath.map((value) => String(value ?? '').trim()).filter(Boolean);
}

function buildTree<T>(items: T[], groupBy?: Array<keyof T>, getPath?: TreeCheckboxSelectorProps<T>['getPath']) {
  const rootNodes: TreeNode<T>[] = [];
  const nodeMap = new Map<string, TreeNode<T>>();

  items.forEach((item) => {
    const path = getItemPath(item, groupBy, getPath);

    path.forEach((label, index) => {
      const currentPath = path.slice(0, index + 1);
      const id = defaultNodeId(currentPath);
      const parentId = index > 0 ? defaultNodeId(path.slice(0, index)) : null;

      let node = nodeMap.get(id);

      if (!node) {
        node = {
          id,
          label,
          value: id,
          level: index,
          path: currentPath,
          sourceItems: [],
          children: [],
        };

        nodeMap.set(id, node);

        if (parentId) {
          const parent = nodeMap.get(parentId);
          parent?.children.push(node);
        } else {
          rootNodes.push(node);
        }
      }

      node.sourceItems.push(item);
    });
  });

  return {
    tree: rootNodes,
    nodeMap,
  };
}

function getVisibleNodeIds<T>(nodes: TreeNode<T>[]): string[] {
  return nodes.flatMap((node) => [node.id, ...getVisibleNodeIds(node.children)]);
}

function filterTree<T>(nodes: TreeNode<T>[], query: string): TreeNode<T>[] {
  if (!query) return nodes;

  return nodes
    .map((node) => {
      const children = filterTree(node.children, query);
      const matches = normalizeText(node.label).includes(query) || normalizeText(node.id).includes(query);

      if (!matches && !children.length) return null;

      return {
        ...node,
        children,
      };
    })
    .filter(Boolean) as TreeNode<T>[];
}

function getLeafIds<T>(node: TreeNode<T>): string[] {
  if (!node.children.length) return [node.id];

  return node.children.flatMap(getLeafIds);
}

function isNodeChecked<T>(node: TreeNode<T>, selected: Set<string>): boolean {
  if (!node.children.length) {
    return selected.has(node.id);
  }

  const leafIds = getLeafIds(node);

  return leafIds.length > 0 && leafIds.every((id) => selected.has(id));
}

function getExpandedIdsForSelected<T>(nodes: TreeNode<T>[], selected: Set<string>): string[] {
  const expandedIds: string[] = [];

  nodes.forEach((node) => {
    if (!node.children.length) return;

    const leafIds = getLeafIds(node);
    const containsSelected = leafIds.some((id) => selected.has(id));

    if (containsSelected) {
      expandedIds.push(node.id);
    }

    expandedIds.push(...getExpandedIdsForSelected(node.children, selected));
  });

  return expandedIds;
}

export function TreeCheckboxSelector<T>({
  items,
  groupBy,
  getPath,
  value,
  defaultValue = [],
  onChange,
  searchable = true,
  placeholder = 'Buscar...',
  emptyText = 'Sin resultados',
  autoExpandSearchResults = true,
  className = '',
}: TreeCheckboxSelectorProps<T>) {
  const [internalValue, setInternalValue] = useState<string[]>(defaultValue);
  const [query, setQuery] = useState('');

  const { tree, nodeMap } = useMemo(() => buildTree(items, groupBy, getPath), [items, groupBy, getPath]);

  const selectedValues = value ?? internalValue;
  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(getExpandedIdsForSelected(tree, selectedSet)),
  );

  const normalizedQuery = normalizeText(query);
  const visibleTree = useMemo(() => filterTree(tree, normalizedQuery), [tree, normalizedQuery]);

  const searchExpandedIds = useMemo(() => {
    if (!normalizedQuery || !autoExpandSearchResults) return new Set<string>();

    return new Set(getVisibleNodeIds(visibleTree));
  }, [visibleTree, normalizedQuery, autoExpandSearchResults]);

  useEffect(() => {
    setExpandedIds((current) => {
      const next = new Set(current);

      getExpandedIdsForSelected(tree, selectedSet).forEach((id) => {
        next.add(id);
      });

      return next;
    });
  }, [tree, selectedSet]);

  const emitChange = (nextSet: Set<string>) => {
    const nextValue = Array.from(nextSet);
    const nextNodes = nextValue.map((id) => nodeMap.get(id)).filter(Boolean) as TreeNode<T>[];

    if (value === undefined) {
      setInternalValue(nextValue);
    }

    onChange?.(nextValue, nextNodes);
  };

  const toggleExpanded = (nodeId: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);

      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }

      return next;
    });
  };

  const toggleNode = (node: TreeNode<T>) => {
    const next = new Set(selectedSet);
    const checked = isNodeChecked(node, selectedSet);
    const leafIds = getLeafIds(node);

    if (checked) {
      leafIds.forEach((id) => next.delete(id));
    } else {
      leafIds.forEach((id) => next.add(id));
    }

    emitChange(next);
  };

  const renderTreeNode = (node: TreeNode<T>) => {
    const checked = isNodeChecked(node, selectedSet);
    const hasChildren = node.children.length > 0;
    const expanded =
      normalizedQuery && autoExpandSearchResults ? searchExpandedIds.has(node.id) : expandedIds.has(node.id);

    return (
      <li key={node.id} className={styles.node}>
        <div
          className={styles.nodeRow}
          style={{ paddingLeft: `${node.level * 18}px` }}
          data-checked={checked || undefined}
          data-indeterminate={undefined}
        >
          <Button
            type="button"
            variant="ghost"
            size="S"
            style={{}}
            onClick={() => toggleExpanded(node.id)}
            disabled={!hasChildren}
            aria-label={expanded ? 'Contraer' : 'Expandir'}
          >
            {hasChildren ? expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} /> : null}
          </Button>

          <label className={styles.checkboxLabel}>
            <input type="checkbox" checked={checked} onChange={() => toggleNode(node)} />

            <span className={styles.customCheckbox} />

            <span className={styles.nodeText}>{node.label}</span>
          </label>
        </div>

        {hasChildren && expanded ? <ul className={styles.children}>{node.children.map(renderTreeNode)}</ul> : null}
      </li>
    );
  };

  const selectedCount = selectedValues.length;

  return (
    <div className={[styles.selector, className].filter(Boolean).join(' ')}>
      {searchable ? (
        <div className={styles.searchWrapper}>
          <Input size="M" value={query} onChange={(event) => setQuery(event)} placeholder={placeholder} />
        </div>
      ) : null}

      <div className={styles.summary}>{selectedCount ? `${selectedCount} seleccionados` : 'Nada seleccionado'}</div>

      <div className={styles.treeViewport}>
        {visibleTree.length ? (
          <ul className={styles.tree}>{visibleTree.map(renderTreeNode)}</ul>
        ) : (
          <div className={styles.empty}>{emptyText}</div>
        )}
      </div>
    </div>
  );
}

export default TreeCheckboxSelector;
