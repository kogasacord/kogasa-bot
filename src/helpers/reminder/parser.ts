
// code note: the grammar is small enough to be an LL(1) parser.
// 		however to make the code support small amounts of backtracking,
// 		i used recursive descent again.
/**
	start         -> (relative | recurring | absolute, content) | (remove | list); 
			// content covers every subsequent string.

	relative      -> "in", relative_num;
	recurring     -> "every", (absolute_num | relative_num);
	absolute      -> "at", absolute_num;
	remove        -> "remove", [number];
	list          -> "list";

	absolute_num  -> {absolute_unit, number}, [clock], timezone;
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
		| "Clock" | "Literal" | "Remove"
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
	units: Literal[],
	content: string,
}
export interface Absolute extends Expr {
	type: "Absolute",
	units: Literal[],
	clock?: Clock,
	timezone: string,
	content: string,
}
export interface Literal extends Expr {
	type: "Literal",
	unit: string,
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
	constructor() {}

	public parse(tokens: RemindToken[]) {
		this.tokens = tokens;
		const expr = this.expression();
		if (!this.isAtEnd()) {
			throw this.error(this.peek(), "Unexpected extra input.");
		}
		this.tokens = [];
		this.current = 0;

		return expr;
	}
	private expression(): Expr {
		if (this.match_and_advance([RemindTokenType.IN])) {
			return this.relative();
		}
		if (this.match_and_advance([RemindTokenType.EVERY])) {
			return this.recurring();
		}
		if (this.match_and_advance([RemindTokenType.AT])) {
			return this.absolute();
		}
		if (this.match_and_advance([RemindTokenType.LIST])) {
			return this.list();
		}
		if (this.match_and_advance([RemindTokenType.REMOVE])) {
			return this.remove();
		}
		throw this.error(this.peek(), "Reminders should start with 'in', 'every', and 'at'.");
	}
	private parseContent(): string {
		const str = [];
		while (this.check(RemindTokenType.STRING)) {
			str.push(this.advance());
		}
		const contents = str.map(v => v.text).join(" ");
		if (contents.trim() === "") {
			throw this.error(this.peek(), "Missing reminder content after time.");
		}
		return contents;
	}
	private parseRelative(): Literal[] {
		const units: Literal[] = [];
		while (this.check(RemindTokenType.NUMBER)) {
			units.push(this.relative_primary());
		}

		return units;
	}
	private list(): List {
		return {
			type: "List"
		};
	}
	private remove(): Remove {
		const index = this.consume(RemindTokenType.NUMBER, "Expected a number for the index.").literal!;
		return {
			type: "Remove",
			index,
		};
	}
	private relative(): Relative {
		const units = this.parseRelative();
		if (units.length <= 0) {
			throw this.error(this.peek(), "You need to put at least one relative date. `in 1d`");
		}
		const content = this.parseContent();
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
		if (next.type === RemindTokenType.ABS_UNIT) {
			return {
				type: "Recurring",
				expr: this.absolute(),
			};
		}
		throw this.error(this.peek(), "Invalid recurring string.");
	}
	private absolute(): Absolute {
		const units: Literal[] = [];
		while (this.check(RemindTokenType.ABS_UNIT)) {
			units.push(this.absolute_primary());
		}

		let clock: Clock | undefined = undefined;
		if (this.match_and_advance([RemindTokenType.DASH])) {
			clock = this.clock();
		}
		const timezone = this.consume(RemindTokenType.STRING, "Expected timezone.").text;
		const content = this.parseContent();

		const abs: Absolute = {
			type: "Absolute",
			units,
			clock,
			timezone,
			content
		};
		return abs;
	}
	private clock(): Clock {
		let hour: number | undefined = undefined; // augh i miss rust's expressions.
		if (this.check(RemindTokenType.NUMBER)) {
			hour = this.advance().literal!;
		}

		this.consume(RemindTokenType.COLON, "Expected ':' in clock.");

		let minute: number | undefined = undefined;
		if (this.check(RemindTokenType.NUMBER)) {
			minute = this.advance().literal!;
		}

		let meridiem: "am" | "pm" | undefined = undefined;
		if (this.check(RemindTokenType.MERIDIEM)) {
			const token = this.advance();
			const text = token.text.toLowerCase();
			if (["am", "pm"].includes(text)) {
				meridiem = structuredClone(text) as "am" | "pm";
			} else {
				throw this.error(token, "Expected 'am' or 'pm'");
			}
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
	private relative_primary(): Literal {
		if (this.check(RemindTokenType.NUMBER)) {
			const num_value = this.advance().literal!;
			const unit = this.consume(RemindTokenType.REL_UNIT, "needs a unit!").text;
			const literal: Literal = { 
				type: "Literal",
				value: num_value,
				unit: unit,
			};
			return literal;
		}
		throw this.error(this.peek(), "Expected expression.");
	}
	private absolute_primary(): Literal {
		if (this.check(RemindTokenType.ABS_UNIT)) {
			const unit = this.advance().text;
			const num_value = this.consume(RemindTokenType.NUMBER, "needs a number!").literal!;
			const literal: Literal = {
				type: "Literal",
				value: num_value,
				unit: unit,
			};
			return literal;
		}
		throw this.error(this.peek(), "Expected expression.");
	}

	private match_and_advance(types: RemindTokenType[]): boolean {
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
	
	private consume(type: RemindTokenType, message: string): RemindToken {
		if (this.check(type)) {
			return this.advance();
		}
		throw this.error(this.previous(), message);
	}

	private error(token: RemindToken, message: string): Error {
		return new Error(`on "${token.type}": ${message}`);
	}
}

