
export class Queue<T> {
	constructor(private max_length: number, private contents: T[] = []) {}
	push(content: T) {
		if (this.contents.length >= this.max_length) {
			this.contents.unshift();
		}
		this.contents.push(content);
	}
	pop() {
		this.contents.pop();
	}
	adjustLength(length: number) {
		this.max_length = length;
	}
	get_internal() {
		return this.contents;
	}
}
