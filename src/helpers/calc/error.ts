import {Token, TokenType} from "./scanner.js";

/**
	* Needs to be initialized for every run.
	*/
export class CalcError {
	private had_error = false;
	private had_runtime_error = false;
	private errors = "";

	constructor() {}

	public error(message: string) {
		this.report("", message);
	}
	/**
	* Reporting scanner errors
	*/
	public scanError(character: string, message: string) {
		this.report(character, message);
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
		this.errors += `RuntimeError: ${message}\n`;
		this.had_runtime_error = true;
	}
	private report(where: string, message: string) {
		this.errors += `Error: ${message} [${where}]\n`;
		this.had_error = true;
	}
	public getHasError(): boolean {
		return this.had_error;
	}
	public getHasRuntimeError(): boolean {
		return this.had_runtime_error;
	}
	public getErrorMessage(): string {
		return this.errors;
	}
}

export class ParseError {
	constructor() {}
}

export class RuntimeError {
	constructor(private token: Token, private message: string) {}
	public getMessage() {
		return `${this.message} at ${this.token.text}`;
	}
}
