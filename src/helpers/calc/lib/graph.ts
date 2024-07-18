import { JSONEdges } from "../data/types";

export class Edge<T> {
	constructor(
		public from: string,
		public to: string,
		public weight: T
	) {}
	toString(): string {
		return `(${this.from} -> ${this.to}, ${this.weight})`;
	}
}

export class WeightedGraph {
	private adj = new Map<string, Edge<number>[]>();

	getAllNodes(): string[] {
		return [...this.adj.keys()];
	}
	addNode(node: string) {
		if (!this.adj.has(node)) {
			this.adj.set(node, []);
		}
		return this;
	}
	addEdge(from: string, to: string, weight: number, reversal_weight: number) {
		if (!this.adj.has(from)) {
			this.addNode(from);
		}
		if (!this.adj.has(to)) {
			this.addNode(to);
		}
		const edge = new Edge<number>(from, to, weight);
		const reversal_edge = new Edge<number>(to, from, reversal_weight);
		this.adj.get(from)?.push(edge);
		this.adj.get(to)?.push(reversal_edge);
		return this;
	}
	getEdgesFromNode(node: string): Edge<number>[] {
		return this.adj.get(node) || [];
	}
	getEdgesFromPath(nodePath: string[]): Edge<number>[] {
		const edges: Edge<number>[] = [];

		for (let i = 0; i < nodePath.length - 1; i++) {
			// Example nodePath is [A, B, D, E]
			// Gets the current node from path. [A]
			const currentNode = nodePath[i];
			// Gets the next node from path, [B]
			const nextNode = nodePath[i + 1];
			// Gets the current edges from the current node [A] if there's A -> B, A -> C... edge, It would be here.
			const nodeEdges = this.getEdgesFromNode(currentNode);
			// It checks the end node of the edge and compares it with our next node from our path. if it sees A -> B.
			// Since B is our next node, it will become true, and the edge will be pushed to our edge array.
			const connectingEdge = nodeEdges.find((edge) => edge.to === nextNode);
			if (connectingEdge) {
				edges.push(connectingEdge);
			}
		}

		return edges;
	}

	bfs(startVertex: string, targetVertex: string): string[] | null {
		const queue: string[] = [startVertex];
		const visited: Set<string> = new Set();
		const predecessor: Map<string, string | null> = new Map();

		visited.add(startVertex);
		predecessor.set(startVertex, null);

		while (queue.length > 0) {
			const currentVertex = queue.shift()!;

			if (currentVertex === targetVertex) {
				// Reconstruct the path
				const path: string[] = [];
				let step = currentVertex;
				while (step !== null) {
					path.unshift(step);
					step = predecessor.get(step)!;
				}
				return path;
			}

			const neighbors = this.getEdgesFromNode(currentVertex);
			for (const neighbor of neighbors) {
				if (!visited.has(neighbor.to)) {
					visited.add(neighbor.to);
					predecessor.set(neighbor.to, currentVertex);
					queue.push(neighbor.to);
				}
			}
		}

		// If no path found
		return null;
	}

	addJSONEdges(edges: JSONEdges) {
		for (const edge of edges) {
			this.addEdge(
				edge.from,
				edge.to,
				edge.forward_weight,
				edge.backward_weight
			);
		}
	}

	printGraph(): void {
		for (const [node, edges] of this.adj) {
			const edgeDetails = edges
				.map((edge) => `${edge.to} (weight: ${edge.weight})`)
				.join(", ");
			console.log(`${node} -> ${edgeDetails}`);
		}
	}
}
