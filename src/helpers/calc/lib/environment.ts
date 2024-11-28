import {RuntimeError} from "./error.js";
import {Token} from "./scanner.js";

export class Environment<T> {
	private values = new Map<string, T>();
	constructor() {}
	public define(name: string, value: T) {
		this.values.set(name, value);
	}
	public get(name: Token) {
		return this.values.get(name.text);
	}
	public clear() {
		this.values.clear();
	}
}
