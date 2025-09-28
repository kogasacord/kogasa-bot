
// code note: the grammar is small enough to be an LL(1) parser.
// 		however to make the code support small amounts of backtracking,
// 		i used recursive descent again.
/**
	start         -> (relative | recurring | absolute, ";", content) | (remove | list); 
			// content covers every subsequent string.

	relative      -> "in", relative_num;
	recurring     -> "every", relative_num;
	absolute      -> "at", absolute_num;
	remove        -> "remove", [number];
	list          -> "list";

	absolute_num  -> {absolute_unit, number}, [clock], ",", timezone;
	relative_num  -> {number, relative_unit};
	absolute_unit -> "Y" | "M" | "D";
	relative_unit -> "d" | "h" | "m";

	clock         -> "-", [number], ":", [number], [meridiem];
	meridiem      -> "am" | "pm";
	timezone      -> string;
	content       -> string;
*/

import {RemindTokenType, RemindToken} from "@helpers/reminder/lexer.js";

export type ExprTypes = "Relative" | "Recurring" | "Absolute" 
		| "Clock" | "Unit" | "Remove"
		| "List";
export interface Expr {
	type: ExprTypes;
}
export interface Recurring extends Expr {
	type: "Recurring",
	expr: Absolute | Relative;
}
export interface Relative extends Expr {
	type: "Relative",
	units: Unit[],
	content: string,
}
export interface Absolute extends Expr {
	type: "Absolute",
	units: Unit[],
	clock?: Clock,
	timezone: string,
	content: string,
}
export interface Unit extends Expr {
	type: "Unit",
	unit: RemindTokenType,
	value: number,
};
export interface Clock extends Expr {
	type: "Clock",
	hour?: number,
	minute?: number,
	meridiem?: "am" | "pm",
};
export interface Remove extends Expr {
	type: "Remove",
	index: number,
}
export interface List extends Expr {
	type: "List", // bit useless, but it can be easily extended.
}


export class RemindParser {
	private current = 0;
	private tokens: RemindToken[] = [];
	private original_string: string = "";

	private readonly ABS_UNITS = [RemindTokenType.YEAR, RemindTokenType.MONTH, RemindTokenType.DATE];
	private readonly REL_UNITS = [RemindTokenType.DAY, RemindTokenType.HOUR, RemindTokenType.MINUTE];
	constructor() {}

	public parse(original_string: string, tokens: RemindToken[]) {
		this.tokens = tokens;
		this.original_string = original_string;
		if (this.tokens.length <= 1) {
			throw this.error(this.peek(), "Empty input. Provide a command like `in 1d message`, `at D25 Asia/Manila message`");
		}
		const expr = this.expression();
		if (!this.isAtEnd()) {
			throw this.error(this.peek(), "Unexpected extra input.");
		}

		return expr;
	}
	public resetParser() {
		this.tokens = [];
		this.current = 0;
		this.original_string = "";
	}
	private expression(): Expr {
		if (this.matchAndAdvance([RemindTokenType.IN])) {
			return this.relative();
		}
		if (this.matchAndAdvance([RemindTokenType.EVERY])) {
			return this.recurring();
		}
		if (this.matchAndAdvance([RemindTokenType.AT])) {
			return this.absolute();
		}
		if (this.matchAndAdvance([RemindTokenType.LIST])) {
			return this.list();
		}
		if (this.matchAndAdvance([RemindTokenType.REMOVE])) {
			return this.remove();
		}
		throw this.error(this.peek(), "Reminders should start with 'in', 'every', and 'at'.");
	}
	private list(): List {
		return {
			type: "List"
		};
	}
	private remove(): Remove {
		const index = this.consume([RemindTokenType.NUMBER], "Expected a number for the index. Did you mean `remove 1`?").literal!;
		return {
			type: "Remove",
			index,
		};
	}
	private relative(): Relative {
		const units = this.parseRelative();

		this.checkCommands();
		if (this.match(this.ABS_UNITS)) {
			throw this.error(this.peek(), "You cannot use absolute units in an \"in\" command. Use relative (`25d`) syntax instead.");
		}

		if (units.length <= 0) {
			throw this.error(this.peek(), "You need to put at least one relative date. `in 1d`");
		}

		const content = this.parseContent("No message found!");

		const expr: Relative = {
			type: "Relative",
			units,
			content,
		};
		return expr;
	}
	private recurring(): Recurring {
		const next = this.peek();
		if (next.type === RemindTokenType.NUMBER) {
			return {
				type: "Recurring",
				expr: this.relative(),
			};
		}
		// hmmm, absolute recurring reminders NOW!!
		if (this.matchNext([...this.ABS_UNITS, RemindTokenType.DASH])) {
			return {
				type: "Recurring",
				expr: this.absolute(),
			};
		}
		throw this.error(this.peek(), "Recurring reminders only accepts relative times. `??rme every 2d Message.`");
	}
	private absolute(): Absolute {
		const units: Unit[] = this.parseAbsolute();

		this.checkCommands();
		if (this.peek().type === RemindTokenType.NUMBER && this.matchNext(this.REL_UNITS)) {
			throw this.error(this.peek(), "You cannot use relative units in an \"at\" command. Use `D25` syntax instead.");
		}
		if (this.match([RemindTokenType.NUMBER])) {
			throw this.error(this.peek(), "Number provided without a unit.");
		}

		let clock: Clock | undefined = undefined;
		if (this.matchAndAdvance([RemindTokenType.DASH])) {
			clock = this.clock();
		}
		const timezone = this.consume([RemindTokenType.STRING], "Expected timezone.").text;
		const content = this.parseContent(`No message found! Did you forget to add a message after the timezone "${timezone}"?`);

		const abs: Absolute = {
			type: "Absolute",
			units,
			clock,
			timezone,
			content
		};
		return abs;
	}

	private parseContent(err: string): string {
		const start = this.peek().start;
		while (!this.isAtEnd()) {
			this.advance();
		}
		const end = this.peek().end;
		const substr = this.original_string.slice(start, end);
		if (substr.length <= 0) {
			throw this.error(this.peek(), err);
		}

		return substr;
	}
	private clock(): Clock {
		let hour: number | undefined = undefined; // augh i miss rust's expressions.
		if (this.check(RemindTokenType.NUMBER)) {
			hour = this.advance().literal!;
		}

		let minute: number | undefined = undefined;
		if (this.match([RemindTokenType.COLON])) {
			this.advance();
			const token = this.consume([RemindTokenType.NUMBER], "You need to indicate the minute hand when you put a colon!");
			minute = token.literal!;
		}

		if (this.check(RemindTokenType.STRING)) {
			throw this.error(this.peek(), "Unknown meridiem!");
		}

		let meridiem: "am" | "pm" | undefined = undefined;
		if (this.check(RemindTokenType.MERIDIEM)) {
			const token = this.advance();
			const text = token.text.toLowerCase();
			meridiem = structuredClone(text) as "am" | "pm";
		}

		if (hour === undefined && minute === undefined) {
			throw this.error(this.peek(), "Clock must have at least one of hour or minute, excluding meridiem will turn it into 24-hr.");
		}

		const clock: Clock = {
			type: "Clock",
			hour, 
			minute, 
			meridiem,
		};
		
		return clock;
	}

	private parseRelative(): Unit[] {
		const literals: Unit[] = [];
		while (this.check(RemindTokenType.NUMBER)) {
			const num_value = this.advance().literal!;
			const unit_text = this.peek().text;
			const unit = this.consume(this.REL_UNITS, `Empty or unknown unit "${unit_text}". Did you mean \`d, h, m\`?`);
			const literal: Unit = { 
				type: "Unit",
				value: num_value,
				unit: unit.type,
			};
			literals.push(literal);
		}

		return literals;
	}
	private parseAbsolute(): Unit[] {
		const literals: Unit[] = [];
		while (this.match(this.ABS_UNITS)) {
			const unit = this.advance();
			const num_value = this.consume([RemindTokenType.NUMBER], "Missing number!").literal!;
			const literal: Unit = {
				type: "Unit",
				value: num_value,
				unit: unit.type,
			};
			literals.push(literal);
		}

		return literals;
	}


	private checkCommands() {
		if (this.match([RemindTokenType.IN, RemindTokenType.EVERY, RemindTokenType.AT, RemindTokenType.LIST, RemindTokenType.REMOVE])) {
			throw this.error(this.peek(), `Unexpected command "${this.peek().type}".`);
		}
	}
	private match(types: RemindTokenType[]): boolean {
		for (const type of types) {
			if (this.check(type)) {
				return true;
			}
		}
		return false;
	}
	private matchNext(types: RemindTokenType[]): boolean {
		for (const type of types) {
			if (this.peek_next().type === type) {
				return true;
			}
		}
		return false;
	}
	private matchAndAdvance(types: RemindTokenType[]): boolean {
		for (const type of types) {
			if (this.check(type)) {
				this.advance();
				return true;
			}
		}
		return false;
	}
	private check(type: RemindTokenType): boolean {
		if (this.isAtEnd()) {
			return false;
		}
		return this.peek().type === type;
	}
	private advance(): RemindToken {
		if (!this.isAtEnd()) {
			this.current++;
		}
		return this.previous();
	}
	private isAtEnd(): boolean {
		return this.peek().type === RemindTokenType.EOF;
	}
	private peek(): RemindToken {
		return this.tokens[this.current];
	}
	private peek_next(): RemindToken {
		return this.tokens[this.current + 1];
	}
	private previous(): RemindToken {
		return this.tokens[this.current - 1];
	}
	
	private consume(types: RemindTokenType[], message: string): RemindToken {
		if (this.match(types)) {
			return this.advance();
		}
		throw this.error(this.previous(), message);
	}

	private error(token: RemindToken, message: string): Error {
		return new Error(`on "${token.type}": ${message}`);
	}
}

