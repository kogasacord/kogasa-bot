import {ASTPrinter} from "./ast_printer.js";
import {CalcError, RuntimeError, Stdout} from "./error.js";
import {Grouping, Literal, Unary, Expr, Binary, Expression, Print, Stmt, VarStmt, VarExpr, Call, Callable, Post} from "./expr.js";
import {Token, TokenType} from "./scanner.js";
import {Environment} from "./environment.js";
import { decimal_factorial, factorial } from "./math/factorial.js";
import chalk from "chalk";

/**
	* Doesn't need to be re-initialized every run
	*/
export class Interpreter {
	private globals = new Environment<number | Callable>();
	private environment = new Environment<number>();

	private printer = new ASTPrinter();

	constructor(private std: Stdout, private calc_error: CalcError) {}

	/**
		* Throws some errors!
		*/
	public interpret(statements: Stmt[]) {
		for (const statement of statements) {
			this.execute(statement);
		}
	}
	public clear_variables() {
		this.environment.clear();
	}
	public add_global(name: string, callable: Callable | number) {
		this.globals.define(name, callable);
		return this;
	}
	public execute(stmt: Stmt) {
		switch (stmt.type) {
			case "Expression":
				const expression = stmt as Expression;
				return this.evaluateExpressionStmt(expression);
			case "Print":
				const p = stmt as Print;
				return this.evaluatePrintStmt(p);
			case "Var":
				const v = stmt as VarStmt;
				return this.evaluateVarStmt(v);
			default:
				return null;
		}
	}

	/**
		* Recursive descent parsing
		*/
	public evaluate(expr: Expr): Expr | number {
		switch (expr.type) {
			case "UnaryExpr":
				const unary = expr as Unary;
				return this.evaluateUnary(unary);
			case "GroupingExpr":
				const grouping = expr as Grouping;
				return this.evaluateGrouping(grouping);
			case "BinaryExpr":
				const binary = expr as Binary;
				return this.evaluateBinary(binary);
			case "LiteralExpr":
				const literal = expr as Literal;
				return this.evaluateLiteral(literal);
			case "VarExpr":
				const v = expr as VarExpr;
				return this.evaluateVarExpr(v);
			case "CallExpr":
				const c = expr as Call;
				return this.evaluateCallExpr(c);
			case "PostExpr":
				const p = expr as Post;
				return this.evaluatePost(p);
			default:
				const t: Token = { type: TokenType.SEMICOLON, text: "???", literal: undefined };
				throw this.runtimeError(new RuntimeError(t, "Something went terribly wrong."));
		}
	}

	public evaluateExpressionStmt(stmt: Expression) {
		return this.evaluate(stmt.expression);
	}
	public evaluatePrintStmt(stmt: Print) {
		const value = this.evaluate(stmt.expression);
		if (typeof value === "number") {
			this.std.stdout(chalk.yellow(value));
		}
		return value;
	}
	public evaluateVarStmt(stmt: VarStmt) {
		const g_var = this.globals.get(stmt.name);

		if (g_var instanceof Callable) {
			const runtime = new RuntimeError(stmt.name, `You should call the function like: sqrt(10).`);
			throw this.runtimeError(runtime);
		}

		if (stmt.initializer === undefined) {
			if (g_var === undefined) {
				const runtime = new RuntimeError(stmt.name, `Variable needs to have an initializer.`);
				throw this.runtimeError(runtime);
			}
			return g_var;
		} else {
			if (g_var !== undefined) {
				const runtime = new RuntimeError(stmt.name, `Global variable can't be reassigned.`);
				throw this.runtimeError(runtime);
			}
			const value = this.evaluate(stmt.initializer);
			if (typeof value === "number") {
				this.environment.define(stmt.name.text, value);
				return value;
			}
		}
	}

	// EXPRs
	public evaluateCallExpr(expr: Call) {
		const callee = expr.callee as VarExpr;
		const callable = this.globals.get(callee.name);
		if (callable === undefined) {
			const runtime = new RuntimeError(expr.paren, `Cannot find a function named "${callee.name.text}".`);
			throw this.runtimeError(runtime);
		}
		const args: number[] = [];
		for (const arg of expr.arguments) {
			const e = this.evaluate(arg);
			if (typeof e === "number") {
				args.push(e);
			}
		}
		if (callable instanceof Callable) {
			if (args.length !== callable.arity) {
				const runtime = new RuntimeError(expr.paren, `Expected ${callable.arity} arguments but got ${args.length}.`);
				throw this.runtimeError(runtime);
			}
			return callable.call(this, args);
		}
		if (typeof callable === "number") {
			const runtime = new RuntimeError(expr.paren, `${callee.name} is not a function, but a number.`);
			throw this.runtimeError(runtime);
		}
		const runtime = new RuntimeError(expr.paren, `Something went wrong with function ${callee.name}.`);
		throw this.runtimeError(runtime);
	}
	public evaluateVarExpr(expr: VarExpr): number {
		const g_var = this.globals.get(expr.name);
		if (g_var instanceof Callable) {
			const runtime = new RuntimeError(expr.name, `You can't use function "${expr.name.text}" as a normal variable.`);
			throw this.runtimeError(runtime);
		}
		const v = g_var ?? this.environment.get(expr.name);
		if (v === undefined) {
			const runtime = new RuntimeError(expr.name, `The variable "${expr.name.text}" does not exist!`);
			throw this.runtimeError(runtime);
		}
		return v;
	}
	public evaluateGrouping(expr: Grouping): number {
		switch (expr.operator.type) {
			case TokenType.BAR:
				const num = this.evaluate(expr.expression) as number;
				return Math.abs(num);
				break;
			case TokenType.LEFT_PAREN:
				// banking on the fact (x + y) would be a number.
				return this.evaluate(expr.expression) as number;
			default:
				const runtime = new RuntimeError(expr.operator, `I can't evaluate that grouping for some reason.`);
				throw this.runtimeError(runtime);
		}
	}
	public evaluatePost(expr: Post) {
		const left = this.evaluate(expr.left);
		if (typeof left !== "number") {
			const runtime = new RuntimeError(expr.operator, `Left of postfix was not a number.`);
			throw this.runtimeError(runtime);
		}
		switch (expr.operator.type) {
			case TokenType.BANG: {
				return decimal_factorial(left);
			}
			default:
				break;
		}
		const runtime = new RuntimeError(expr.operator, `Wrong usage of postfix.`);
		throw this.runtimeError(runtime);
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

		const runtime = new RuntimeError(expr.operator, `Error evaluating Unary expression.`);
		throw this.runtimeError(runtime);
	}
	public evaluateBinary(expr: Binary) {
		const left = this.evaluate(expr.left);
		const right = this.evaluate(expr.right);

		if (typeof left !== "number" || typeof right !== "number") {
			const runtime = new RuntimeError(expr.operator, `Left or Right in binary was not a number.`);
			throw this.runtimeError(runtime);
		}

		switch (expr.operator.type) {
			case TokenType.MINUS:
				return left - right;
			case TokenType.SLASH:
				return left / right;
			case TokenType.STAR:
				return left * right;
			case TokenType.PLUS:
				return left + right;
			case TokenType.CARAT:
				return Math.pow(left, right);
			case TokenType.ROOT: {
				if (left <= 0) {
					const runtime = new RuntimeError(expr.operator, `You can't do negative roots. Will support soon though!`);
					throw this.runtimeError(runtime);
				}
				if (right <= 0) {
					const runtime = new RuntimeError(expr.operator, `You can't do a root on negative values.`);
					throw this.runtimeError(runtime);
				}
				return Math.pow(right, 1/left);
			}
		}

		const runtime = new RuntimeError(expr.operator, `Error evaluating Binary expression.`);
		throw this.runtimeError(runtime);
	}

	private runtimeError(err: RuntimeError) {
		this.calc_error.runtimeError(err);
		return err;
	}
}
