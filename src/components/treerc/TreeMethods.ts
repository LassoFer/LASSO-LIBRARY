import type { Key } from "rc-tree/lib/interface";
import type { TreeRCNode } from "./TreeRC";

type DropInfoLike = {
	node: TreeRCNode & {
		key: Key;
		expanded?: boolean;
		children?: TreeRCNode[];
	};
	dragNode: TreeRCNode & {
		key: Key;
	};
	dropToGap?: boolean;
	dropPosition: number;
};

export function handleDrop(info: DropInfoLike, treeData: TreeRCNode[], setTreeData: (treeData: TreeRCNode[]) => void) {
	const dropKey = info.node.key;
	const dragKey = info.dragNode.key;
	const dropPosition = info.dropToGap ? info.dropPosition - 1 : info.dropPosition;

	const dataCopy = structuredClone(treeData) as TreeRCNode[];

	let dragNode: TreeRCNode | undefined;

	loop(dataCopy, dragKey, (_item, index, arr) => {
		const removedNode = arr.splice(index, 1)[0];
		dragNode = removedNode;
	});

	if (!dragNode) return;

	if (!info.dropToGap) {
		loop(dataCopy, dropKey, (item) => {
			item.children = item.children || [];
			item.children.push(dragNode);
		});
	} else if ((info.node.children || []).length > 0 && info.node.expanded && dropPosition === 0) {
		loop(dataCopy, dropKey, (item) => {
			item.children = item.children || [];
			item.children.unshift(dragNode);
		});
	} else {
		let targetArray: TreeRCNode[] | undefined;
		let targetIndex: number | undefined;

		loop(dataCopy, dropKey, (_item, index, arr) => {
			targetArray = arr;
			targetIndex = index;
		});

		if (!targetArray || targetIndex === undefined) return;

		if (dropPosition === -1) {
			targetArray.splice(targetIndex, 0, dragNode);
		} else {
			targetArray.splice(dropPosition, 0, dragNode);
		}
	}

	setTreeData(dataCopy);
}

function loop(
	treeData: TreeRCNode[],
	key: Key,
	callback: (item: TreeRCNode, index: number, arr: TreeRCNode[]) => void,
) {
	for (let index = 0; index < treeData.length; index++) {
		const item = treeData[index];

		if (item.key === key) {
			callback(item, index, treeData);
			return;
		}

		if (item.children) {
			loop(item.children, key, callback);
		}
	}
}
