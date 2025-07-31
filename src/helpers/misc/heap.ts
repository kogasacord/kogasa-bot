
export interface Heap<HeapNode extends { value: number }> {
	findMin(): HeapNode;
	deleteMin(): HeapNode;
	decreaseKey(): boolean;
	insert(node: HeapNode): void;
	meld(heap: Heap<HeapNode>): void;
	makeHeap(nodes: HeapNode[]): void;
}

export class BinaryMinHeap<HeapNode extends {value: number}> implements Heap<HeapNode> {
	private nodes: HeapNode[] = [];
	constructor() {}

	public makeHeap(nodes: HeapNode[]): void {
		for (const node of nodes) {
			this.insert(node);
		}
	}
	public findMin(): HeapNode {
		const node = this.nodes.at(0);
		if (node !== undefined) {
			return node;
		} else {
			throw new Error("Empty array.");
		}
	}
	public deleteMin(): HeapNode {
		if (this.nodes.length === 0) {
			throw new Error("Heap is empty.");
		}
		const removedNode = this.nodes[0];
		if (this.nodes.length === 1) {
			this.nodes.pop();
		} else {
			this.nodes[0] = this.nodes.pop()!;
			this.heapifyDown();
		}
		return removedNode;
	}
	public insert(node: HeapNode) {
		this.nodes.push(node);
		this.heapifyUp();
	}
	public getNodes() {
		return this.nodes;
	}

	public decreaseKey(): boolean {
		throw new Error("Unimplemented.");
	}
	public meld(heap: Heap<HeapNode>): boolean {
		throw new Error("Unimplemented.");
	}

	private heapifyUp() {
		let index = this.nodes.length - 1;
		while (this.hasParent(index) 
			   && this.parent(index)!.value > this.nodes[index].value) {
			this.swap(this.getParentIndex(index), index);
			index = Number(this.getParentIndex(index));
		}
	}
	private heapifyDown() {
		let index = 0;
		while (this.hasLeftChild(index)) {
			let smallerChildIndex = this.getLeftChildIndex(index);

			if (
				this.hasRightChild(index) &&
				this.rightChild(index)!.value < this.leftChild(index)!.value
			) {
				smallerChildIndex = this.getRightChildIndex(index);
			}

			if (this.nodes[index].value <= this.nodes[smallerChildIndex].value) {
				break;
			}

			this.swap(index, smallerChildIndex);
			index = smallerChildIndex;
		}
	}

	private getLeftChildIndex(parent_index: number): number {
		return 2 * parent_index + 1;
	}
	private getRightChildIndex(parent_index: number): number {
		return 2 * parent_index + 2;
	}
	private getParentIndex(child_index: number): number {
		return Math.floor((child_index - 1) / 2);
	}
	private hasLeftChild(index: number): boolean {
		return this.getLeftChildIndex(index) < this.nodes.length;
	}
	private hasRightChild(index: number): boolean {
		return this.getRightChildIndex(index) < this.nodes.length;
	}
	private hasParent(index: number): boolean {
		return this.getParentIndex(index) >= 0;
	}
	private leftChild(index: number): HeapNode | undefined {
		return this.nodes[this.getLeftChildIndex(index)];
	}
	private rightChild(index: number): HeapNode | undefined {
		return this.nodes[this.getRightChildIndex(index)];
	}
	private parent(index: number): HeapNode | undefined {
		return this.nodes[this.getParentIndex(index)];
	}

	private swap(index1: number, index2: number) {
		const temp = this.nodes[index1];
		this.nodes[index1] = this.nodes[index2];
		this.nodes[index2] = temp;
	}
}
