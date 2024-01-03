import {Token} from "./scanner.js";

export interface Expr {
	type: "BinaryExpr" | "GroupingExpr" | "LiteralExpr" | "UnaryExpr"
};

export interface Binary extends Expr {
	left: Expr,
	operator: Token,
	right: Expr,
};
export interface Grouping extends Expr {
	expression: Expr,
};
export interface Literal extends Expr {
	value: number
};
export interface Unary extends Expr {
	operator: Token,
	right: Expr,
};
