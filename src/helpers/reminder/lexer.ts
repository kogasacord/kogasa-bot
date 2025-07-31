
export type RemindToken = {
	type: RemindTokenType;
	text: string;
	literal: number | undefined;
};
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
	TIMEZONE = "TIMEZONE",

	EOF = "EOF",
}

export class RemindLexer {
	private start = 0;
	private current = 0;
	private tokens: RemindToken[] = [];
	private keywords: { [key: string]: RemindTokenType } = {
		in: RemindTokenType.IN,
		every: RemindTokenType.EVERY,
		at: RemindTokenType.AT,
		remove: RemindTokenType.REMOVE,
		list: RemindTokenType.LIST,
		Y: RemindTokenType.ABS_UNIT,
		M: RemindTokenType.ABS_UNIT,
		D: RemindTokenType.ABS_UNIT,
		d: RemindTokenType.REL_UNIT,
		h: RemindTokenType.REL_UNIT,
		m: RemindTokenType.REL_UNIT,
	};
	private str: string = "";
	constructor() {}

	public parse(str: string) {
		this.str = str;

		while (!this.is_at_end()) {
			this.start = this.current;
			const char = this.advance();
			switch (char) {
				case "\r":
				case "\t":
				case "\n":
				case " ":
					break;
				case ":":
					this.add_token(RemindTokenType.COLON);
					break;
				case "-":
					this.add_token(RemindTokenType.DASH);
					break;
				case ";":
					this.message();
					break;
				case ",":
					this.timezone();
					break;
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
					} else {
						// Skip unknown characters like punctuation unless in message mode
						// This prevents random punctuation from being tokenized
					}
			}
		}
		this.tokens.push({
			type: RemindTokenType.EOF,
			text: "",
			literal: undefined,
		});

		const tokens = structuredClone(this.tokens);
		return tokens;
	}
	public resetLexer() {
		this.str = "";
		this.start = 0;
		this.current = 0;
		this.tokens = [];
	}

	private message() {
		const raw = this.str.substring(this.current).trim();
		this.current = this.str.length;

		if (raw.length > 0) {
			this.tokens.push({
				type: RemindTokenType.STRING,
				text: raw,
				literal: undefined,
			});
		}
	}
	private timezone() {
		while (this.peek() !== ";") {
			this.advance();
		}
		// skips the leading comma by slicing from start + 1
		// this.start = this.current hasn't ran so we're offsetting this.start
		// this shouldn't affect the main loop i think?
		const text = this.str.substring(this.start + 1, this.current).trim();
		if (text.length > 0) {
			this.tokens.push({
				type: RemindTokenType.TIMEZONE,
				text: text,
				literal: undefined,
			});
		}
	}

	// Fix handling of semicolon and whitespace
	private identifier() {
		while (this.is_alpha(this.peek())) {
			this.advance();
		}
		const text = this.str.substring(this.start, this.current).trim();

		let token_type = this.keywords[text];
		if (["am", "pm"].includes(text.toLowerCase())) {
			token_type = RemindTokenType.MERIDIEM;
		}
		if (token_type === undefined) {
			token_type = RemindTokenType.STRING;
		}

		this.add_token(token_type);
	}

	private is_alpha(c: string) {
		return (
			(c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_" || c === "/"
		);
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
			text: this.str.substring(this.start, this.current).trim(),
			literal: literal,
		};
		this.tokens.push(token);
	}
}
