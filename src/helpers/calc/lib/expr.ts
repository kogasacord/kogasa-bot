import {Interpreter} from "./interpreter.js";
import {Token} from "./scanner.js";

export class Callable {
	public arity: number = 0;
	call(interpreter: Interpreter, args: number[]) {return 0;};
}

export interface Expr {
	type: "BinaryExpr" | "GroupingExpr" | "LiteralExpr" | "UnaryExpr" | "PostExpr"
	| "VarExpr" | "CallExpr";
};

export interface Binary extends Expr {
	left: Expr,
	operator: Token,
	right: Expr,
};
export interface Grouping extends Expr {
	operator: Token,
	expression: Expr,
};
export interface Literal extends Expr {
	value: number
};
export interface Unary extends Expr {
	operator: Token,
	right: Expr,
};
export interface Post extends Expr {
	operator: Token,
	left: Expr,
};

export interface VarExpr extends Expr {
	name: Token, // uses the variable.
}
export interface Call extends Expr {
	callee: Expr,
	paren: Token,
	arguments: Expr[],
}

export interface Stmt {
	type: "Expression" | "Var" | "Print"
}

export interface Expression extends Stmt {
	expression: Expr
}
export interface Print extends Stmt {
	expression: Expr
}
export interface VarStmt extends Stmt { // declares a variable.
	name: Token,
	initializer: Expr,
}
