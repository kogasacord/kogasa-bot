
import {CalcError, ParseError} from "./error.js";
import {Binary, Expr, Grouping, Literal, Stmt, Unary, Print, Expression, VarStmt, VarExpr, Callable, Call, Post, ArrayExpr, isExprStmt} from "./expr.js";
import {Token, TokenType} from "./scanner.js";


/**
	* Needs to be re-initialized every run
	*/
export class RecursiveDescentParser {
	private current = 0;
	constructor(
		private tokens: Token[],
		private calc_error: CalcError,
		private measurements: string[]
	) {}
	public parse() {
		const statements: Stmt[] = [];
		while (!this.isAtEnd()) {
			const declaration = this.declaration();
			if (declaration) {
				statements.push(declaration);
			}
		}
		const last = statements.at(-1);
		if (last && isExprStmt(last)) {
			const p: Print = {type: "Print", expression: last.expression};
			statements[statements.length - 1] = p;
		}
		return statements;
	}

	private declaration() {
		try {
			if (this.peek().type === TokenType.IDENTIFIER 
					&& this.peek_next().type !== TokenType.LEFT_PAREN)
			{
				return this.varDeclaration();
			}
			return this.statement();
		} catch (error) {
			this.synchronize();
			return null;
		}
	}

	private statement(): Stmt {
		if (this.match_and_advance([TokenType.PRINT])) {
			return this.printStatement();
		}
		return this.expressionStatement();
	}
	private varDeclaration() { // i = 10 + 10;
		const name = this.consume(TokenType.IDENTIFIER, "Expected variable name.");
		let initializer = undefined;
		if (this.match_and_advance([TokenType.EQUALS])) {
			initializer = this.expression();
			this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");
		}
		const vardecl: VarStmt = { type: "Var", name: name, initializer: initializer! };
		return vardecl;
	}
	private printStatement() {
		if ([TokenType.EQUALS, TokenType.PLUS, TokenType.SLASH, TokenType.STAR].includes(this.peek().type)) {
			throw this.error(this.peek(), "You can't operate on a print statement.");
		}
		if (this.peek().type === TokenType.SEMICOLON) {
			throw this.error(this.previous(), "You need to put an expression like 1 or 1 + 2 into it.");
		}
		const expr: Expr = this.expression();
		this.consume(TokenType.SEMICOLON, "Expect ';' after value.");
		const p: Print = {type: "Print", expression: expr};
		return p;
	}
	private expressionStatement() {
		const expr: Expr = this.expression();
		this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
		const e: Expression = {type: "Expression", expression: expr};
		return e;
	}


	private expression() {
		return this.term();
	}
	private term(): Expr {
		let expr = this.factor(); // 1 + 2 * 3 / 4 - 5
		while (this.match_and_advance([TokenType.MINUS, TokenType.PLUS])) {
			const operator = this.previous();
			const right = this.factor();
			const binary: Binary = {type: "BinaryExpr", left: expr, operator: operator, right: right};
			expr = binary;
		}
		return expr;
	}
	private factor(): Expr {
		let expr: Expr = this.higher_factor();
		while (this.match_and_advance([TokenType.SLASH, TokenType.STAR])) {
			const operator = this.previous();
			const right = this.higher_factor();
			const binary: Binary = {type: "BinaryExpr", left: expr, operator: operator, right: right};
			expr = binary;
		}
		return expr;
	}
	// this gets executed first.
	private higher_factor(): Expr {
		let expr: Expr = this.unary();
		while (this.match_and_advance([TokenType.ROOT, TokenType.CARAT])) {
			const operator = this.previous();
			const right = this.unary();
			const binary: Binary = {type: "BinaryExpr", left: expr, operator: operator, right: right};
			expr = binary;
		}
		return expr;
	}
	private unary(): Expr { // 1 + 2 * 3 / 4 - 5
		if (this.match_and_advance([TokenType.MINUS])) {
			const operator = this.previous();
			const right = this.post();
			const unary_obj: Unary = {type: "UnaryExpr", operator: operator, right: right};
			return unary_obj;
		}
		return this.post();
	}
	private post() {
		let expr = this.call();
		if (this.match_and_advance([TokenType.BANG])) {
			const operator = this.previous();
			const post_obj: Post = {type: "PostExpr", operator: operator, left: expr };
			expr = post_obj;
		}
		return expr;
	}
	private call() {
		let expr = this.primary();
		if (this.match_and_advance([TokenType.LEFT_PAREN])) {
			if (expr.type !== "VarExpr") {
				const literal_expr = expr as Literal;
				const token: Token = { type: TokenType.NUMBER, text: literal_expr.value.toString(), literal: literal_expr.value };
				throw this.error(token, "A number can't be called.");
			}
			expr = this.parse_arguments(expr);
		}
		return expr;
	}
	private parse_arguments(callee: Expr) {
		const args: Expr[] = [];
		if (!this.check(TokenType.RIGHT_PAREN)) {
			do {
				args.push(this.expression());
			} while (this.match_and_advance([TokenType.COMMA]));
		}
		const paren = this.consume(TokenType.RIGHT_PAREN, "Expected ')' after arguments.");

		const call_obj: Call = { type: "CallExpr", callee: callee, paren: paren, arguments: args };
		return call_obj;
	}

	private primary(): Expr {
		if (this.match_and_advance([TokenType.NUMBER])) {
			return this.num();
		}
		if (this.match_and_advance([TokenType.IDENTIFIER])) {
			return this.var();
		}
		if (this.match_and_advance([TokenType.LEFT_SQ])) {
			return this.array();
		}
		/*
		if (this.match_and_advance([TokenType.LEFT_CURLY])) {
			// LATEX PARSER HERE!!!
		}
		*/
		if (this.match_and_advance([TokenType.LEFT_PAREN, TokenType.BAR, TokenType.LEFT_SQ])) {
			return this.grouping();
		}

		throw this.error(this.peek(), "Expected expression.");
	}

	private num() {
		const num_value = this.previous().literal!;
		let number_type;
		if (this.match_and_advance([TokenType.IDENTIFIER])) {
			number_type = this.previous().text;
		} // this will look like "NUMBER IDENTIFIER?"
		if (number_type !== undefined && !this.measurements.includes(number_type)) {
			throw this.error(this.previous(), "Unknown measurement type.");
		}
		const literal: Literal = { 
			type: "LiteralExpr",
			value: num_value,
			label: number_type,
		};
		return literal;
	}

	private var() {
		const v = this.previous();
		const index = this.indexer();
		const varexpr: VarExpr = { type: "VarExpr", name: v, indexer: index };
		return varexpr;
	}
	private array() {
		const elements = this.parse_elements();
		this.consume(TokenType.RIGHT_SQ, "Expected ']' after expression.");

		const index = this.indexer();
		const arr_obj: ArrayExpr = { elements: elements, type: "ArrayExpr", indexer: index };
		return arr_obj;
	}

	private indexer(): Expr | undefined {
		let index;
		if (this.match_and_advance([TokenType.LEFT_SQ])) {
			const indexer = this.expression();
			this.consume(TokenType.RIGHT_SQ, "Expected ']' after expression.");
			index = indexer;
		}
		return index;
	}

	private grouping() {
		const prev = this.previous();
		const expr = this.expression();
		switch (prev.type) {
			case TokenType.LEFT_PAREN:
				this.consume(TokenType.RIGHT_PAREN, "Expected ')' after expression.");
				break;
			case TokenType.BAR:
				this.consume(TokenType.BAR, "Expected '|' after expression.");
				break;
			default:
				throw this.error(prev, "Something went horribly wrong when parsing groupings.");
		}
		const grouping: Grouping = {type: "GroupingExpr", operator: prev, expression: expr};
		return grouping;
	}

	private parse_elements(): Expr[] {
		const args: Expr[] = [];
		do {
			args.push(this.expression());
		} while (this.match_and_advance([TokenType.COMMA]));
		return args;
	}

	// separate this into a separate class later.
	
	private match_and_advance(types: TokenType[]): boolean {
		for (const type of types) {
			if (this.check(type)) {
				this.advance();
				return true;
			}
		}
		return false;
	}
	private check(type: TokenType): boolean {
		if (this.isAtEnd()) {
			return false;
		}
		return this.peek().type === type;
	}
	private advance(): Token {
		if (!this.isAtEnd()) {
			this.current++;
		}
		return this.previous();
	}
	private isAtEnd(): boolean {
		return this.peek().type === TokenType.EOF;
	}
	private peek(): Token {
		return this.tokens[this.current];
	}
	private peek_next(): Token {
		return this.tokens[this.current + 1];
	}
	private previous(): Token {
		return this.tokens[this.current - 1];
	}
	
	private consume(type: TokenType, message: string): Token {
		if (this.check(type)) {
			return this.advance();
		}
		throw this.error(this.previous(), message);
	}

	private error(token: Token, message: string): ParseError {
		this.calc_error.tokenError(token, message);
		return new ParseError();
	}
	private synchronize() {
		this.advance();
		while (!this.isAtEnd()) {
			if (this.previous().type === TokenType.SEMICOLON) {
				return;
			}
			switch (this.peek().type) {
				case TokenType.PRINT:
				case TokenType.IDENTIFIER:
					return;
			}
			this.advance();
		}
	}
}
