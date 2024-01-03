import {ASTPrinter} from "./ast_printer.js";
import {Grouping, Literal, Unary, Expr, Binary} from "./expr.js";
import {TokenType} from "./scanner.js";

/**
	* Doesn't need to be re-initialized every run
	*/
export class Interpreter {
	private printer = new ASTPrinter();

	/**
		* also used in groupingExpr
		*/
	public evaluate(expr: Expr): Expr | number | null {
		switch (expr.type) {
			case "UnaryExpr": {
				const unary = expr as Unary;
				return this.evaluateUnary(unary);
			}
			case "GroupingExpr": {
				const grouping = expr as Grouping;
				return this.evaluateGrouping(grouping);
			}
			case "BinaryExpr": {
				const binary = expr as Binary;
				return this.evaluateBinary(binary);
			}
			case "LiteralExpr": {
				const literal = expr as Literal;
				return this.evaluateLiteral(literal);
			}
			default:
				throw Error("you fucking suck at coding");
		}
	}

	public evaluateGrouping(expr: Grouping) {
		return this.evaluate(expr.expression);
	}
	public evaluateLiteral(expr: Literal) {
		return expr.value;
	}
	public evaluateUnary(expr: Unary) {
		const right = this.evaluate(expr.right)!;

		switch (expr.operator.type) {
			case TokenType.MINUS:
				if (typeof right === "number")
					return -right;
		}

		throw Error(`Error evaluating Unary expression: ${this.printer.parse(expr)}`);
	}
	public evaluateBinary(expr: Binary) {
		const left = this.evaluate(expr.left);
		const right = this.evaluate(expr.right);

		if (typeof left !== "number" || typeof right !== "number")
			throw Error(`Left or Right in binary was not a number: ${this.printer.parse(expr)}`);

		switch (expr.operator.type) {
			case TokenType.MINUS:
				return left - right;
			case TokenType.SLASH:
				return left / right;
			case TokenType.STAR:
				return left * right;
			case TokenType.PLUS:
				return left + right;
		}

		throw Error(`Error evaluating Binary expression: ${this.printer.parse(expr)}`);
	}
}
