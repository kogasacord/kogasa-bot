import { ASTPrinter } from "@helpers/calc/lib/ast_printer.js";
import { Interpreter } from "@helpers/calc/lib/interpreter.js";
import { RecursiveDescentParser } from "@helpers/calc/lib/parser.js";
import { Tokenizer } from "@helpers/calc/lib/scanner.js";
import { CalcError, Stdout } from "@helpers/calc/lib/error.js";
import {
	Cosine,
	Log,
	Sine,
	Tangent,
	Base2Log,
	Base10Log,
	HyperbolicCosine,
	HyperbolicSine,
	HyperbolicTangent,
	InverseHyperbolicCosine,
	InverseHyperbolicSine,
	InverseHyperbolicTangent,
	InverseSine,
	InverseCosine,
	InverseTangent,
} from "@helpers/calc/functions/trig.js";
import {
	Abs,
	Clock,
	Sqrt,
	Ceiling,
	Floor,
	Round,
	Signum,
	Maximum,
	Minimum,
	Cbrt,
	Num,
	LCM,
	GCD,
	Factor,
} from "@helpers/calc/functions/standard.js";

import { WeightedGraph } from "@helpers/calc/lib/graph.js";
import { createConversionFunction } from "@helpers/calc/functions/conversion.js";
import { edges } from "@helpers/calc/data/units.js";

import { Client, Message } from "discord.js";
import { ChannelScope } from "@helpers/types";

export const name = "calc";
export const aliases = [];
export const cooldown = 5;
export const channel: ChannelScope[] = ["Guild", "DMs"];
export const description = "Basic calculator.";
export const extended_description =
	"If you want to use this: [Documentation](https://github.com/DoormatIka/calculator-interpreter)";
export async function execute(_client: Client, msg: Message, args: string[]) {
	const input = msg.content.split(" ").slice(1).join(" "); // raw input, no command name.
	if (input.length <= 0) {
		msg.reply("[Usage](<https://github.com/DoormatIka/calculator-interpreter>) of the calculator");
		return;
	}
	const res = run_interpreter(input);
	if (res.length >= 1) {
		msg.reply(res);
	} else {
		msg.reply(
			"To view a value, you must add `p` to it. E.g: `p 1 + 1`. This is to support variables."
		);
	}
}

const graph = new WeightedGraph();
const out = new Stdout();
const calc_err = new CalcError(out);
const interpreter = new Interpreter(out, calc_err);

graph.addJSONEdges(edges);
const measurement_units = graph.getAllNodes();

interpreter
	// Standard Functions
	.add_global("clock", new Clock())
	.add_global("num", new Num()) // removes the label
	// Math Functions
	.add_global("sin", new Sine())
	.add_global("cos", new Cosine())
	.add_global("tan", new Tangent())
	.add_global("log", new Log())
	.add_global("log2", new Base2Log())
	.add_global("log10", new Base10Log())
	.add_global("sqrt", new Sqrt())
	.add_global("cbrt", new Cbrt())
	.add_global("abs", new Abs())
	.add_global("pi", {num_value: Math.PI})
	.add_global("e", {num_value: Math.E})
	.add_global("ceil", new Ceiling())
	.add_global("floor", new Floor())
	.add_global("round", new Round())
	.add_global("signum", new Signum())
	.add_global("max", new Maximum())
	.add_global("min", new Minimum())
	.add_global("asin", new InverseSine())
	.add_global("acos", new InverseCosine())
	.add_global("atan", new InverseTangent())
	.add_global("cosh", new HyperbolicCosine())
	.add_global("sinh", new HyperbolicSine())
	.add_global("tanh", new HyperbolicTangent())
	.add_global("acosh", new InverseHyperbolicCosine())
	.add_global("asinh", new InverseHyperbolicSine())
	.add_global("atanh", new InverseHyperbolicTangent())
	.add_global("lcm", new LCM())
	.add_global("gcd", new GCD())
	.add_global("factor", new Factor());
for (const unit of measurement_units) {
	interpreter.add_global(unit, createConversionFunction(unit, graph));
}
const printer = new ASTPrinter();

function run_interpreter(calc: string) {
	const tokenizer = new Tokenizer(out, calc);
	const parsed_tokens = tokenizer.parse();
	const parser = new RecursiveDescentParser(
		parsed_tokens,
		calc_err,
		measurement_units
	);

	try {
		const tree = parser.parse();
		if (tree && !calc_err.getHasError()) {
			interpreter.interpret(tree);
		}
	} catch (error: unknown) {
		// shh
	}

	const s = structuredClone(out.get_stdout());
	out.clear_stdout();
	calc_err.resetErrors();
	printer.clearStr();
	interpreter.clear_variables();

	return s;
}
