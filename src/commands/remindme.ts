import { Client, Message } from "discord.js";

import { ExternalDependencies } from "@helpers/helpers.js";
import { ChannelScope } from "@helpers/types";
import {RemindLexer} from "@helpers/reminder/lexer.js";
import {RemindParser} from "@helpers/reminder/parser.js";


const lexer = new RemindLexer();
const parser = new RemindParser();

export const name = "remindme";
export const aliases = ["rme", "remind"];
export const cooldown = 8;
export const channel: ChannelScope[] = ["Guild", "DMs", "Thread"];
export const description = "Reminds you.";
export const extended_description =
	"\n**To add a reminder**" +
	"\n- `??remindme in 2d3h1m; Do the dishes`" +
	"\n- `??remindme at Y2026D10-5AM, America; Remind me at year 2026, current month, 10th day, at 5AM, timezone `" +
	"\n**To delete a reminder**" +
	"\n- `??remindme list` to list the reminders you have." +
	"\n- `??remindme remove [number]` to remove a reminder on that list.";
export async function execute(
	_client: Client,
	msg: Message,
	args: string[],
	external_data: ExternalDependencies
) {
	const reminder_emitter = external_data.reminder_emitter;
	// to be replaced by @helpers/reminders/parser.ts
	
	try {
		const tokens = lexer.parse(args.join(" "));
		msg.reply(`$tokens: ${JSON.stringify(tokens)}`);
		const expr = parser.parse(tokens);
		msg.reply(`$expr: ${JSON.stringify(expr, null, 4)}`);
		const res = reminder_emitter.parseExpr(msg.author.id, expr);
		msg.reply(JSON.stringify(res, null, 4));
		switch (res.action) {
			case "push": {
				msg.reply("Added to reminders!");
				break;
			}
			case "pop": {
				msg.reply("Removed reminder.");
				break;
			}
			case "list": {
				const v = res.content
					.map(v => {
						if (v.command === "Absolute" || v.command === "Relative" || v.command === "Recurring") {
							return `${v.to_date.format("MMM DD YYYY HH:mm ZZ")} (${v.command})`;
						}
					})
					.join("\n");
				msg.reply(v);
				break;
			}

			default:
				break;
		}
	} catch (error) {
		msg.reply(`#: ${error}`);
	}

	lexer.resetLexer();
	parser.resetParser();
}


