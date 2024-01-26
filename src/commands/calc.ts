import { ASTPrinter } from "@helpers/calc/ast_printer.js";
import { Interpreter } from "@helpers/calc/interpreter.js";
import { Tokenizer } from "@helpers/calc/scanner.js";
import { CalcError } from "@helpers/calc/error.js";
import { RecursiveDescentParser } from "@helpers/calc/parser.js";

import { Client, Message } from "discord.js";

const interpreter = new Interpreter();
const printer = new ASTPrinter();

export const name = "calc";
export const aliases = ["calc"];
export const cooldown = 5;
export const channel = "Guild";
export const description = "Basic calculator. Programming language soon.";
export async function execute(_client: Client, msg: Message, args: string[]) {
	const input = args.join(" ");
	const val = run_interpreter(printer, interpreter, input);
	if (val) {
		const split_error = val.error_res?.split("\n").slice(0, 3);
		const has_more_errors = split_error && split_error.length > 3;

		const and_more = (has_more_errors && "\n...and more") || "";
		const error_message = (split_error && split_error.join("\n") + and_more) || split_error?.join("\n");

		msg.reply(error_message ?? `Result: ${val.value}`);
	} else {
		msg.reply("How did you get here.");
	}
}

function run_interpreter(
	printer: ASTPrinter,
	interpreter: Interpreter,
	calc: string
) {
	const calc_error = new CalcError();
	const tokenizer = new Tokenizer(calc, calc_error);

	const parsed_tokens = tokenizer.parse();
	const parser = new RecursiveDescentParser(calc_error, parsed_tokens);

	const tree = parser.parse();
	if (tree) {
		const tree_look = printer.parse(tree);
		let value = 0;
		let error_res: string | undefined = undefined;
		try {
			value = interpreter.evaluate(tree) as number;
		} catch (error: unknown) {
			const err = error as Error;
			error_res = err.message;
		}
		return { value, parsed_tokens, tree_look, error_res };
	}
	return {
		error_res: calc_error.getErrorMessage(),
	};
}
