import {CalcError, RuntimeError, Stdout} from "./error.js";
import {Grouping, Literal, Unary, Expr, Binary, Expression, Print, Stmt, VarStmt, VarExpr, Call, Callable, Post, LabelledNumber, ArrayType, ArrayExpr, isArrayType, isLabelledNumber} from "./expr.js";
import {Token, TokenType} from "./scanner.js";
import {Environment} from "./environment.js";
import {decimal_factorial} from "./math/factorial.js";
import {dec2frac} from "./math/dec2frac.js";

function formatPrint(value: LabelledNumber | ArrayType): string {
	if (isLabelledNumber(value)) {
		return numberToString(value);
	}
	if (isArrayType(value)) {
		return value.elements.map(c => numberToString(c)).join(", ");
	}
	return "";
}
export function numberToString(value: LabelledNumber) {
	const val = `${value.num_value}${value.type ?? ""}`;
	if (Number.isInteger(value.num_value)) {
		return val;
	} else {
		const whole_part = Math.floor(value.num_value);
		const decimal_part = value.num_value - whole_part;

		const [numerator, denominator] = dec2frac(decimal_part);
		return `${whole_part === 0 ? "" : `${whole_part} `}${numerator}/${denominator}${value.type ?? ""} (${val})`;
	}
}

/**
	* Doesn't need to be re-initialized every run
	*/
export class Interpreter {
	private globals = new Environment<LabelledNumber | Callable>();
	private environment = new Environment<LabelledNumber | ArrayType>();

	constructor(private std: Stdout, private calc_error: CalcError) {}

	/**
		* Throws some errors!
		*/
	public interpret(statements: Stmt[]) {
		for (let i = 0; i < statements.length; i++) {
			const statement = statements[i];
			this.execute(statement);
		}
	}
	public clear_variables() {
		this.environment.clear();
	}
	public add_global(name: string, callable: Callable | LabelledNumber) {
		this.globals.define(name, callable);
		return this;
	}
	public execute(stmt: Stmt): LabelledNumber | undefined {
		switch (stmt.type) {
			case "Expression": {
				const expression = stmt as Expression;
				return this.evaluateExpressionStmt(expression);
			}
			case "Print": {
				const p = stmt as Print;
				const value = this.evaluatePrintStmt(p);
				if (value) {
					this.std.stdout(formatPrint(value));
				}
				break;
			}
			case "Var": {
				const v = stmt as VarStmt;
				this.evaluateVarStmt(v);
				break;
			}
		}
	}

	// Stmt
	public evaluateExpressionStmt(stmt: Expression): LabelledNumber {
		return this.evaluate(stmt.expression) as LabelledNumber;
	}
	public evaluatePrintStmt(stmt: Print): LabelledNumber | ArrayType | undefined {
		const value = this.evaluate(stmt.expression);
		if (isLabelledNumber(value) || isArrayType(value)) {
			return value;
		}
	}
	public evaluateVarStmt(stmt: VarStmt) {
		const g_var = this.globals.get(stmt.name);
		const l_var = this.environment.get(stmt.name);

		if (stmt.initializer === undefined) {
			if (g_var === undefined && l_var === undefined) {
				const runtime = new RuntimeError(stmt.name, "Variable needs to have an initializer.");
				throw this.runtimeError(runtime);
			}
			return g_var;
		}

		// handle global variable reassignment/conflict with a function name
		if (g_var !== undefined) {
			const errorMessage = g_var instanceof Callable
				? "That function has already been defined. Please replace the name."
				: "Global variable can't be reassigned.";
			throw this.runtimeError(new RuntimeError(stmt.name, errorMessage));
		}

		// evaluate and put the result in the variable.
		const value = this.evaluate(stmt.initializer);
		if (isLabelledNumber(value) || isArrayType(value)) {
			this.environment.define(stmt.name.text, value);
			return value;
		}

		throw this.runtimeError(new RuntimeError(stmt.name, "Invalid initializer value."));
	}

	/**
		* Recursive descent parsing
		*/
	public evaluate(expr: Expr): Expr | LabelledNumber | ArrayType {
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
			case "ArrayExpr":
				const a = expr as ArrayExpr;
				return this.evaluateArray(a);
			default:
				const t: Token = { type: TokenType.SEMICOLON, text: "???", literal: undefined };
				throw this.runtimeError(new RuntimeError(t, "Something went terribly wrong."));
		}
	}

	// EXPRs
	public evaluateCallExpr(expr: Call): LabelledNumber | ArrayType {
		const callee = expr.callee as VarExpr;
		const callable = this.globals.get(callee.name);
		if (callable === undefined) {
			const runtime = new RuntimeError(expr.paren, `Cannot find a function named "${callee.name.text}".`);
			throw this.runtimeError(runtime);
		}
		const args: LabelledNumber[] = [];
		for (const arg of expr.arguments) {
			const e = this.evaluate(arg);
			if (isLabelledNumber(e)) {
				args.push(e);
			}
		}
		if (callable instanceof Callable) {
			if (callable.variable_arity <= 0 && args.length !== callable.arity) {
				const runtime = new RuntimeError(expr.paren, `Expected ${callable.arity} arguments but got ${args.length}.`);
				throw this.runtimeError(runtime);
			}
			if (callable.variable_arity > 0 && callable.variable_arity > args.length) {
				const runtime = new RuntimeError(expr.paren, `Expected at least ${callable.variable_arity} argument.`);
				throw this.runtimeError(runtime);
			}
			try {
				const num = callable.call(this, args);
				return num;
			} catch (err: unknown) {
				const runtime = err as RuntimeError;
				throw this.runtimeError(runtime);
			}
		}
		if (isLabelledNumber(callable)) {
			const runtime = new RuntimeError(expr.paren, `${callee.name} is not a function, but a number.`);
			throw this.runtimeError(runtime);
		}
		const runtime = new RuntimeError(expr.paren, `Something went wrong with function ${callee.name}.`);
		throw this.runtimeError(runtime);
	}
	public evaluateVarExpr(expr: VarExpr): LabelledNumber | ArrayType {
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
		// array
		if (expr.indexer) {
			if (isLabelledNumber(v)) {
				const runtime = new RuntimeError(expr.name, "The indexer is a number.");
				throw this.runtimeError(runtime);
			}
			if (isArrayType(v)) {
				const indexer = this.evaluate(expr.indexer);
				if (isLabelledNumber(indexer)) {
					return v.elements[indexer.num_value];
				}
			}
		}
		return v;
	}
	public evaluateGrouping(expr: Grouping): LabelledNumber {
		switch (expr.operator.type) {
			case TokenType.BAR: {
				const num = this.evaluate(expr.expression) as LabelledNumber;
				return { type: num.type, num_value: Math.abs(num.num_value) };
			}
			case TokenType.LEFT_PAREN: {
				// banking on the fact (x + y) would be a number.
				return this.evaluate(expr.expression) as LabelledNumber;
			}
			default:
				const runtime = new RuntimeError(expr.operator, "I can't evaluate that grouping for some reason.");
				throw this.runtimeError(runtime);
		}
	}

	public evaluateArray(expr: ArrayExpr): ArrayType | LabelledNumber {
		const results: LabelledNumber[] = [];
		for (const e of expr.elements) { // [1, 2, 3, 4]
			const res = this.evaluate(e);
			if (isLabelledNumber(res)) {
				results.push(res);
			}
		}

		if (expr.indexer) { // [1, 2, 3, 4][1]
			const r = this.evaluate(expr.indexer);
			if (isLabelledNumber(r)) {
				return results[r.num_value];
			}
		}

		return { elements: results };
	}

	public evaluatePost(expr: Post): LabelledNumber {
		const left = this.evaluate(expr.left);

		if (!isLabelledNumber(left)) {
			const runtime = new RuntimeError(expr.operator, "Left of postfix was not a number.");
			throw this.runtimeError(runtime);
		}
		if (expr.operator.type === TokenType.BANG) {
			const val = decimal_factorial(left.num_value);
			return { type: left.type, num_value: val };
		}
		const runtime = new RuntimeError(expr.operator, "Wrong usage of postfix.");
		throw this.runtimeError(runtime);
	}
	public evaluateLiteral(expr: Literal): LabelledNumber {
		return { type: expr.label, num_value: expr.value };
	}
	public evaluateUnary(expr: Unary): LabelledNumber {
		const right = this.evaluate(expr.right)!;
		if (expr.operator.type === TokenType.MINUS) {
			if (isLabelledNumber(right))
				return { num_value: -right.num_value, type: right.type };
		}

		const runtime = new RuntimeError(expr.operator, "Error evaluating Unary expression.");
		throw this.runtimeError(runtime);
	}
	public evaluateBinary(expr: Binary): LabelledNumber {
		const left = this.evaluate(expr.left);
		const right = this.evaluate(expr.right);

		if (!isLabelledNumber(left) || !isLabelledNumber(right)) {
			const runtime = new RuntimeError(expr.operator, "Left or Right in binary was not a number.");
			throw this.runtimeError(runtime);
		}

		switch (expr.operator.type) {
			case TokenType.MINUS: {
				if (left.type === right.type) { // undefined === undefined
					const val = left.num_value - right.num_value;
					return { num_value: val, type: left.type };
				}
				const runtime = new RuntimeError(expr.operator, `Number ${left.num_value} of label ${left.type} can't be subtracted from a number ${right.num_value} of label ${right.type}.`);
				throw this.runtimeError(runtime);
			}
			case TokenType.PLUS: {
				if (left.type === right.type) { // undefined === undefined
					const val = left.num_value + right.num_value;
					return { num_value: val, type: left.type };
				}
				const runtime = new RuntimeError(expr.operator, `Number ${left.num_value} of label ${left.type} can't be added from a number ${right.num_value} of label ${right.type}.`);
				throw this.runtimeError(runtime);
			}
			case TokenType.SLASH: {
				if (left.type === undefined || right.type === undefined) {
					const val = left.num_value / right.num_value;
					const resultType = left.type !== undefined ? left.type : right.type;
					return { num_value: val, type: resultType };
				} else {
					const runtime = new RuntimeError(expr.operator, "Dividing two labeled numbers is not supported.");
					throw this.runtimeError(runtime);
				}
			}
			case TokenType.STAR: {
				if (left.type === undefined || right.type === undefined) {
					const val = left.num_value * right.num_value;
					const resultType = left.type !== undefined ? left.type : right.type;
					return { num_value: val, type: resultType };
				} else {
					const runtime = new RuntimeError(expr.operator, "Multiplying two labeled numbers is not supported.");
					throw this.runtimeError(runtime);
				}
			}
			case TokenType.CARAT: {
				if (left.type === undefined && right.type === undefined) {
					const val = Math.pow(left.num_value, right.num_value);
					return {num_value: val, type: left.type};
				}
				const runtime = new RuntimeError(expr.operator, "Labelled numbers cannot be operated with an exponent.");
				throw this.runtimeError(runtime);
			}
			case TokenType.ROOT: {
				// how do i handle 1cm root 2km ???
				if (left.num_value <= 0) {
					const runtime = new RuntimeError(expr.operator, "You can't do negative roots. Will support soon though!");
					throw this.runtimeError(runtime);
				}
				if (right.num_value <= 0) {
					const runtime = new RuntimeError(expr.operator, "You can't do a root on negative values.");
					throw this.runtimeError(runtime);
				}
				if (left.type === undefined && right.type === undefined) {
					const val = Math.pow(right.num_value, 1/left.num_value);
					return {num_value: val, type: left.type};
				}
				const runtime = new RuntimeError(expr.operator, "Labelled numbers cannot be operated with a root.");
				throw this.runtimeError(runtime);
			}
		}

		const runtime = new RuntimeError(expr.operator, "Error evaluating Binary expression.");
		throw this.runtimeError(runtime);
	}

	private runtimeError(err: RuntimeError) {
		this.calc_error.runtimeError(err);
		return err;
	}
}


