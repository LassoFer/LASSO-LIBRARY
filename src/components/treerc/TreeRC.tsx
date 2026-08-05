import Tree from "rc-tree";
import "rc-tree/assets/index.css";
import type { Key } from "rc-tree/lib/interface";
import { useMemo } from "react";
import { handleDrop } from "./TreeMethods";
import styles from "./TreeRC.module.css";

export type TreeRCNode = {
	key: Key;
	id?: Key;
	title?: React.ReactNode;
	show?: boolean;
	isLeaf?: boolean;
	expanded?: boolean;
	children?: TreeRCNode[];
	data?: {
		children?: unknown[];
		[key: string]: unknown;
	};
	[key: string]: unknown;
};

type TreeRCProps = {
	treeData: TreeRCNode[];
	setTreeData: (treeData: TreeRCNode[]) => void;
	onDragging: (node?: TreeRCNode, treeData?: TreeRCNode[], setTreeData?: (treeData: TreeRCNode[]) => void) => void;
	renderTreeNode: (node: TreeRCNode) => React.ReactNode;
	deleteTitles?: () => void;
	handleOnSelect: (keys: Key[]) => void | Promise<void>;
	showLoader?: boolean;
	onExpand?: (expandedKeys: Key[]) => void;
	expandedKeys: Key[];
	defaultSelectedKeys?: Key[];
	selectedKeys?: Key[];
	defaultExpandAll?: boolean;
	iconChild?: string;
	iconParent?: string;
	iconParentOpen?: string;
	iconParentPlus?: string;
	plusIcon?: boolean;
	treeContainerRef?: React.Ref<HTMLDivElement>;
};

export default function TreeRC({
	treeData,
	setTreeData,
	onDragging,
	renderTreeNode,
	deleteTitles,
	handleOnSelect,
	showLoader = false,
	onExpand,
	expandedKeys,
	defaultSelectedKeys,
	selectedKeys,
	defaultExpandAll = false,
	iconChild = "fa-solid fa-chalkboard",
	iconParent = "fa fa-folder",
	iconParentOpen = "fa fa-folder-open",
	iconParentPlus = "fa fa-folder-plus",
	plusIcon = false,
	treeContainerRef = null,
}: TreeRCProps) {
	const treeDataToShow = useMemo(() => filterSelectedFolders(treeData), [treeData]);

	function setNodeIcon(node: TreeRCNode) {
		const nodeId = node.id ?? node.key;

		if (node.isLeaf && !node.data?.children) {
			return <i className={iconChild} onClick={() => handleOnSelect([nodeId])} />;
		}

		if (node.expanded) {
			return <i className={iconParentOpen} onClick={() => handleOnSelect([nodeId])} />;
		}

		if (!node.isLeaf && !node.expanded && node.data?.children?.length) {
			if (plusIcon) {
				return (
					<div onClick={() => handleOnSelect([nodeId])} className={styles.plusIconWrapper}>
						<i className={iconParentPlus} />
						<span className={styles.plusIconBadge}>+</span>
					</div>
				);
			}

			return <i className={iconParentPlus} onClick={() => handleOnSelect([nodeId])} />;
		}

		return <i className={iconParent} onClick={() => handleOnSelect([nodeId])} />;
	}

	function renderLoader() {
		return (
			<div className={styles.loaderContainer}>
				<div className={styles.dotTree} />
				<div className={styles.dotTree} />
				<div className={styles.dotTree} />
				<div className={styles.dotTree} />
			</div>
		);
	}

	return (
		<div className={styles.treeContainer} ref={treeContainerRef}>
			{!showLoader ? (
				<Tree
					expandedKeys={[...expandedKeys]}
					onExpand={(keys) => onExpand?.(keys as Key[])}
					defaultExpandAll={defaultExpandAll}
					expandAction="click"
					onMouseEnter={(event) => {
						const items = document.getElementsByClassName("draggingProject");

						if (items.length === 0) return;

						onDragging(event.node as TreeRCNode, treeData, setTreeData);
					}}
					onDrop={(event) => handleDrop(event, treeData, setTreeData)}
					treeData={treeDataToShow}
					titleRender={(node) => renderTreeNode(node as TreeRCNode)}
					onSelect={async (keys) => {
						await handleOnSelect(keys as Key[]);
					}}
					defaultSelectedKeys={defaultSelectedKeys}
					selectedKeys={selectedKeys}
					onMouseLeave={() => {
						const items = document.getElementsByClassName("draggingProject");

						if (items.length === 0) return;

						onDragging(undefined);
					}}
					icon={() => null}
					switcherIcon={(nodeProps) => {
						deleteTitles?.();
						return setNodeIcon(nodeProps as TreeRCNode);
					}}
				/>
			) : (
				renderLoader()
			)}
		</div>
	);
}

function filterSelectedFolders(treeData: TreeRCNode[]): TreeRCNode[] {
	return treeData
		.filter((node) => node.show)
		.map((node) => ({
			...node,
			children: node.children ? filterSelectedFolders(node.children) : undefined,
		}));
}
