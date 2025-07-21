

export type RemindToken = {
	type: RemindTokenType,
	text: string,
	literal: number | undefined,
}
export enum RemindTokenType {
	IN = "IN",
	EVERY = "EVERY",
	AT = "AT",
	REMOVE = "REMOVE",
	LIST = "LIST",
	ABS_UNIT = "ABS_UNIT",
	REL_UNIT = "REL_UNIT",
	COLON = "COLON",
	DASH = "DASH",
	NUMBER = "NUMBER",
	STRING = "STRING",
	MERIDIEM = "MERIDIEM",

	EOF = "EOF"
}

export class RemindLexer {
	private start = 0;
	private current = 0;
	private tokens: RemindToken[] = [];
	private keywords: {[key: string]: RemindTokenType} = {
		"in": RemindTokenType.IN,
		"every": RemindTokenType.EVERY,
		"at": RemindTokenType.AT,
		"remove": RemindTokenType.REMOVE,
		"list": RemindTokenType.LIST,
	};
	private str: string = "";
	constructor() {}

	public parse(str: string) {
		this.str = str;

		while (!this.is_at_end()) {
			this.start = this.current;
			const char = this.advance();
			switch (char) {
				case " ":
				case "\r":
				case "\t":
				case "\n":
					break;
				case ":": this.add_token(RemindTokenType.COLON); break;
				case "-": this.add_token(RemindTokenType.DASH); break;
				case "Y":
				case "M": 
				case "D":
					this.add_token(RemindTokenType.ABS_UNIT); 
					break;
				case "d":
				case "h":
				case "m":
					this.add_token(RemindTokenType.REL_UNIT);
					break;
				default:
					if (this.is_digit(char)) {
						this.number();
					} else if (this.is_alpha(char)) {
						this.identifier();
					}
			}
		}
		this.tokens.push({ type: RemindTokenType.EOF, text: "", literal: undefined });

		const tokens = structuredClone(this.tokens);
		this.str = "";
		this.start = 0;
		this.current = 0;
		this.tokens = [];
		return tokens;
	}

	private identifier() {
		while (this.is_alphanumeric(this.peek())) {
			this.advance();
		}
		const text = this.str.substring(this.start, this.current);

		let token_type = this.keywords[text];
		if (text === "am" || text === "pm") {
			token_type = RemindTokenType.MERIDIEM;
		}
		if (token_type === undefined) {
			token_type = RemindTokenType.STRING;
		}
		this.add_token(token_type);
	}

	private is_alphanumeric(c: string) {
		return this.is_alpha(c) || this.is_digit(c);
	}
	private is_alpha(c: string) {
		return (c >= "a" && c <= "z") || 
			(c >= "A" && c <= "Z") || 
			c === "_" || c === "/";
	}
	private is_at_end() {
		return this.current >= this.str.length;
	}
	private advance() {
		return this.str.charAt(this.current++);
	}
	private peek() {
		return this.str.charAt(this.current);
	}
	private peek_next() {
		return this.str.charAt(this.current + 1);
	}
	private is_digit(str: string) {
		return str >= "0" && str <= "9";
	}
	private number() {
		while (this.is_digit(this.peek())) {
			this.advance();
		}
		if (this.peek() === "." && this.is_digit(this.peek_next())) {
			this.advance(); // consumes the "."
			while (this.is_digit(this.peek())) {
				this.advance();
			}
		}
		const num = Number.parseFloat(this.str.substring(this.start, this.current));
		this.add_token(RemindTokenType.NUMBER, num);
	}
	private add_token(token_type: RemindTokenType, literal?: number) {
		const token: RemindToken = {
			type: token_type,
			text: this.str.substring(this.start, this.current),
			literal: literal,
		};
		this.tokens.push(token);
	}
}

