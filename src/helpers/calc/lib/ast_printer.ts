import {ArrayExpr, Binary, Call, Expr, Expression, Grouping, Literal, Post, Print, Stmt, Unary, VarExpr, VarStmt} from "./expr.js";

/**
	* Doesn't need to be re-initialized every run.
	*/
export class ASTPrinter {
	private str = "";
	constructor() {}

	clearStr() {
		this.str = "";
	}

	parseStmts(nodes: Stmt[]) {
		for (const node of nodes) {
			const s = this.parseStmt(node);
			console.log(s);
		}
	}

	parseStmt(node: Stmt) {
		switch (node.type) {
			case "Expression":
				const expr = node as Expression;
				this.parseExpr(expr.expression);
				break;
			case "Var":
				const v = node as VarStmt;
				this.str += "( [VarDecl] ";
				this.str += `${v.name.text} `;
				this.parseExpr(v.initializer);
				this.str += " )";
				break;
			case "Print":
				const p = node as Print;
				this.str += "( [Print] ";
				this.parseExpr(p.expression);
				this.str += " )";
				break;
			default:
				console.log("Something happened.");
				break;
		}
		return this.str;
	}

	parseExpr(node: Expr) {
		switch (node.type) {
			case "BinaryExpr":
				const binary_node = node as Binary;
				this.str += "( [Binary] ";
				this.parseExpr(binary_node.left);
				this.str += ` ${binary_node.operator.text} `;
				this.parseExpr(binary_node.right);
				this.str += " )";
				break;

			case "GroupingExpr":
				const grouping_node = node as Grouping;
				this.str += "( [Grouping] ";
				this.parseExpr(grouping_node.expression);
				this.str += " )";
				break;

			case "LiteralExpr":
				const literal_node = node as Literal;
				this.str += `[Literal] ${literal_node.value}${literal_node.label ? literal_node.label : ""}`;
				break;

			case "UnaryExpr":
				const unary_node = node as Unary;
				this.str += "( [Unary] ";
				this.str += `${unary_node.operator.text} `;
				this.parseExpr(unary_node.right);
				this.str += " )";
				break;

			case "VarExpr":
				const var_node = node as VarExpr;
				this.str += `[VarExpr] ${var_node.name.text}`;
				if (var_node.indexer) {
					this.str += `( [Indexer] `
					this.parseExpr(var_node.indexer);
					this.str += " )";
				}
				this.str += " )";
				break;

			case "PostExpr":
				const post_node = node as Post;
				this.str += `( [Post] `;
				this.str += `${post_node.operator.text} `;
				this.parseExpr(post_node.left);
				this.str += " )";
				break;
			case "CallExpr":
				const call = node as Call;
				this.str += `( [Call] `;
				this.parseExpr(call.callee);
				for (const arg of call.arguments) {
					this.parseExpr(arg);
				}
				this.str += " )";
				break;
			case "ArrayExpr":
				const arr = node as ArrayExpr;
				this.str += `( [Array] `;
				for (const elem of arr.elements) {
					this.parseExpr(elem);
					this.str += ", "
				}
				if (arr.indexer) {
					this.str += `( [Indexer] `
					this.parseExpr(arr.indexer);
					this.str += " )";
				}
				this.str += " )";
				break;
			default:
				console.log(`broo what happened ;~;`);
				console.log(node);
				break;
		}
		return this.str;
	}


}

