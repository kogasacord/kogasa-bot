import {Token, TokenType} from "./scanner.js";

export class Stdout {
	private out = "";
	constructor() {}
	public stdout(str: string | number) {
		this.out += `${str}\n`;
	}
	public get_stdout() {
		return this.out.trim();
	}
	public clear_stdout() {
		this.out = "";
	}
}

export class CalcError {
	private had_error = false;
	private had_runtime_error = false;
	constructor(private out: Stdout) {}

	public error(message: string) {
		this.report("", message);
	}
	/**
	* Reporting tokenizer errors
	*/
	public tokenError(token: Token, message: string) {
		if (token.type === TokenType.EOF) {
			this.report("at end", message);
		} else {
			this.report(`at '${token.text}'`, message);
		}
	}
	/**
	* Reporting run time errors
	*/
	public runtimeError(error: RuntimeError) {
		const message = error.getMessage();
		this.out.stdout(`RuntimeError: ${message}`);
		this.had_runtime_error = true;
	}
	private report(where: string, message: string) {
		this.out.stdout(`Error: ${message} [${where}]`);
		this.had_error = true;
	}
	public getHasError(): boolean {
		return this.had_error;
	}
	public getHasRuntimeError(): boolean {
		return this.had_runtime_error;
	}
	public resetErrors() {
		this.had_error = false;
		this.had_runtime_error = false;
	}
}

export class ParseError {
	constructor() {}
}

export class RuntimeError {
	constructor(private token: Token, private message: string) {}
	public getMessage() {
		return `${this.message} [at ${this.token.text}]`;
	}
}
