
export class Queue<T> {
	constructor(private max_length: number, private contents: T[] = []) {}
	push(content: T) {
		if (this.contents.length >= this.max_length) {
			this.contents.shift();
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

const queues = new Queue<number>(5);

for (let index = 0; index < 20; index++) {
	queues.push(index);
	console.log(queues.get_internal());
}
