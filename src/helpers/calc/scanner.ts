import {CalcError} from "./error.js";

export type Token = {
	type: TokenType,
	text: string,
	literal: number | undefined,
}

export enum TokenType {
	LEFT_PAREN, 
	RIGHT_PAREN,
	DOT, MINUS, PLUS, SLASH, STAR, 

	NUMBER, 

	EOF
}

/**
	* Needs to be re-initialized every run.
	*/
export class Tokenizer { // glorified function, but it follows crafting interpreters' OOP practices ig
	private start = 0;
	private current = 0;
	private tokens: Token[] = [];
	constructor(private str: string, private calc: CalcError) {}

	public parse() {
		while (!this.is_at_end()) {
			this.start = this.current;
			const char = this.advance();
			switch (char) {
				case " ":
				case "\r":
				case "\t": // skipping whitespace
					break;
				case "(": this.add_token(TokenType.LEFT_PAREN); break;
				case ")": this.add_token(TokenType.RIGHT_PAREN); break;
				case ".": this.add_token(TokenType.DOT); break;
				case "-": this.add_token(TokenType.MINUS); break;
				case "+": this.add_token(TokenType.PLUS); break;
				case "*": this.add_token(TokenType.STAR); break;
				case "/": this.add_token(TokenType.SLASH); break;
				default:
					if (this.is_digit(char)) {
						this.number();
					} else {
						this.calc.scanError(`[${this.start}-${this.current}]`, "Numbers are expected");
					}
					break;
			}
		}
		this.tokens.push({ type: TokenType.EOF, text: "", literal: undefined });
		return this.tokens;
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
