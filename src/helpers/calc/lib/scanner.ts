import {Stdout} from "./error";

export type Token = {
	type: TokenType,
	text: string,
	literal: number | undefined,
}

export enum TokenType {
	LEFT_PAREN, 
	RIGHT_PAREN,
	DOT, MINUS, PLUS, SLASH, STAR,
	CARAT, BANG, BAR,

	NUMBER,

	PRINT, ROOT, 

	SEMICOLON, COMMA,
	IDENTIFIER, EQUALS,

	EOF,
}
// {  } array
// [  ] equation

/**
	* Needs to be re-initialized every run.
	*/
export class Tokenizer {
	private start = 0;
	private current = 0;
	private tokens: Token[] = [];
	private unexpected_chars: { char: string, index: number }[] = [];
	private keywords: {[key: string]: TokenType} = {
		p: TokenType.PRINT,
		root: TokenType.ROOT,
	};

	constructor(private out: Stdout, private str: string) {}

	public parse() {
		while (!this.is_at_end()) {
			this.start = this.current;
			const char = this.advance();
			switch (char) {
				case " ":
				case "\r":
				case "\t": // skipping whitespace
				case "\n":
					break;
				case "(": this.add_token(TokenType.LEFT_PAREN); break;
				case ")": this.add_token(TokenType.RIGHT_PAREN); break;
				case ".": this.add_token(TokenType.DOT); break;
				case "-": this.add_token(TokenType.MINUS); break;
				case "+": this.add_token(TokenType.PLUS); break;
				case "*": this.add_token(TokenType.STAR); break;
				case "/": this.add_token(TokenType.SLASH); break;
				case ";": this.add_token(TokenType.SEMICOLON); break;
				case "=": this.add_token(TokenType.EQUALS); break;
				case ",": this.add_token(TokenType.COMMA); break;
				case "^": this.add_token(TokenType.CARAT); break;
				case "!": this.add_token(TokenType.BANG); break;
				case "|": this.add_token(TokenType.BAR); break;
				default:
					if (this.is_digit(char)) {
						this.number();
					} else if (this.is_alpha(char)) {
						this.identifier();
					} else {
						if (this.unexpected_chars.length < 5) {
							this.unexpected_chars.push({ 
								char: this.str[this.current],
								index: this.current 
							});
						}
					}
					break;
			}
		}
		if (this.unexpected_chars.length >= 1) {
			const e = `Unexpected character at characters [${this.unexpected_chars.map(c => `${c.char} at ${c.index}`).join(", ")}].`;
			this.out.stdout(e);
		}
		if (this.tokens.findIndex(v => v.type === TokenType.SEMICOLON) === -1) {
			// optional semicolon.
			this.tokens.push({ type: TokenType.SEMICOLON, text: ";", literal: undefined });
		}
		this.tokens.push({ type: TokenType.EOF, text: "", literal: undefined });
		return this.tokens;
	}
	private identifier() {
		while (this.is_alphanumeric(this.peek())) {
			this.advance();
		} // gets the identifiers
		const text = this.str.substring(this.start, this.current);
		let token_type = this.keywords[text];
		if (token_type === undefined) {
			token_type = TokenType.IDENTIFIER;
		}
		this.add_token(token_type);
	}
	private is_alpha(c: string) {
		return (c >= "a" && c <= "z") || 
			(c >= "A" && c <= "Z") || 
			c == "_";
	}
	private is_alphanumeric(c: string) {
		return this.is_alpha(c) || this.is_digit(c);
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
		this.add_token(TokenType.NUMBER, num);
	}
	private add_token(token_type: TokenType, literal?: number) {
		const token: Token = {
			type: token_type,
			text: this.str.substring(this.start, this.current),
			literal: literal,
		};
		this.tokens.push(token);
	}
	private match(exp: string) {
		if (this.is_at_end()) {
			return false;
		}
		if (this.str.charAt(this.current) !== exp) {
			return false;
		}
		this.current++;
		return true;
	}
}
