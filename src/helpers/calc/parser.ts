import { CalcError, ParseError } from "./error.js";
import { Binary, Expr, Grouping, Literal, Unary } from "./expr.js";
import { Token, TokenType } from "./scanner.js";

/**
 * Needs to be re-initialized every run
 */
export class RecursiveDescentParser {
	private current = 0;
	constructor(
		private calc_error: CalcError,
		private tokens: Token[]
	) {}
	public parse() {
		// 1 + 2 * 3 / 4 - 5
		try {
			return this.expression();
		} catch (err) {
			// this is so dirty what the fuck.
			return null;
		}
	}

	private expression() {
		return this.term();
	}
	private term() {
		let expr = this.factor(); // 1 + 2 * 3 / 4 - 5
		while (this.match_and_advance([TokenType.MINUS, TokenType.PLUS])) {
			const operator = this.previous();
			const right = this.factor();
			const binary: Binary = {
				type: "BinaryExpr",
				left: expr,
				operator: operator,
				right: right,
			};
			expr = binary;
		}
		return expr;
	}
	private factor() {
		//
		let expr: Expr = this.unary();
		while (this.match_and_advance([TokenType.SLASH, TokenType.STAR])) {
			const operator = this.previous();
			const right = this.unary();
			const binary: Binary = {
				type: "BinaryExpr",
				left: expr,
				operator: operator,
				right: right,
			};
			expr = binary;
		}
		return expr;
	}
	private unary(): Expr {
		// 1 + 2 * 3 / 4 - 5
		if (this.match_and_advance([TokenType.MINUS])) {
			const operator = this.previous();
			const right = this.unary(); // we're getting the value from here
			const unary_obj: Unary = {
				type: "UnaryExpr",
				operator: operator,
				right: right,
			};
			return unary_obj;
		}
		return this.primary();
	}
	private primary(): Expr {
		if (this.match_and_advance([TokenType.NUMBER])) {
			const literal: Literal = {
				type: "LiteralExpr",
				value: this.previous().literal!,
			};
			return literal;
		}
		if (this.match_and_advance([TokenType.LEFT_PAREN])) {
			const expr = this.expression();
			this.consume(TokenType.RIGHT_PAREN, "Expected ')' after expression.");
			const grouping: Grouping = { type: "GroupingExpr", expression: expr };
			return grouping;
		}
		throw this.error(this.peek(), "Unable to find number.");
	}

	// separate this into a separate class later.

	private match_and_advance(types: TokenType[]) {
		for (const type of types) {
			if (this.check(type)) {
				this.advance();
				return true;
			}
		}
		return false;
	}
	private check(type: TokenType) {
		if (this.isAtEnd()) {
			return false;
		}
		return this.peek().type === type;
	}
	private advance() {
		if (!this.isAtEnd()) {
			this.current++;
		}
		return this.previous();
	}
	private isAtEnd() {
		return this.peek().type === TokenType.EOF;
	}
	private peek() {
		return this.tokens[this.current];
	}
	private previous() {
		return this.tokens[this.current - 1];
	}

	// error
	private consume(type: TokenType, message: string) {
		if (this.check(type)) {
			return this.advance();
		}
		throw this.error(this.peek(), message);
	}

	private error(token: Token, message: string): ParseError {
		this.calc_error.tokenError(token, message);
		return new ParseError();
	}
}
