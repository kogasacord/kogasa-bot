import { Binary, Expr, Grouping, Literal, Unary } from "./expr.js";

/**
 * Doesn't need to be re-initialized every run.
 */
export class ASTPrinter {
	private str = "";
	constructor() {}
	parse(node: Expr) {
		switch (node.type) {
			case "BinaryExpr": {
				const binary_node = node as Binary;
				this.str += "( [Binary] ";
				this.parse(binary_node.left);
				this.str += ` ${binary_node.operator.text} `;
				this.parse(binary_node.right);
				this.str += " )";

				break;
			}

			case "GroupingExpr": {
				const grouping_node = node as Grouping;
				this.str += "( [Grouping] ";
				this.parse(grouping_node.expression);
				this.str += " )";

				break;
			}

			case "LiteralExpr": {
				const literal_node = node as Literal;
				this.str += `[Literal] ${literal_node.value}`;

				break;
			}

			case "UnaryExpr": {
				const unary_node = node as Unary;
				this.str += "( [Unary] ";
				this.str += `${unary_node.operator.text} `;
				this.parse(unary_node.right);
				this.str += " )";

				break;
			}

			default:
				console.log("broo what happened ;~;");
				break;
		}
		return this.str;
	}
}
