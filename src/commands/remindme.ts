import { Client, EmbedBuilder, Message } from "discord.js";

import { ExternalDependencies } from "@helpers/helpers.js";
import { ChannelScope } from "@helpers/types";
import {RemindLexer} from "@helpers/reminder/lexer.js";
import {RemindParser} from "@helpers/reminder/parser.js";
import {MainReminderCommand} from "@helpers/reminder/command.js";


const lexer = new RemindLexer();
const parser = new RemindParser();

export const name = "remindme";
export const aliases = ["rme", "remind"];
export const cooldown = 1;
export const channel: ChannelScope[] = ["Guild", "DMs", "Thread"];
export const description = "Reminds you.";
export const extended_description =
	"\n**To add a reminder**" +
	"\n- `<prefix>remindme in 2d3h1m Do the dishes`" +
	"\n- `<prefix>remindme at Y2026D10-5:AM America/Anchorage Remind me at year 2026, current month, 10th day, at 5AM`" +
	"\n- `<prefix>remindme every 10h Reminds every 10h.`" +
	"\n**To delete a reminder**" +
	"\n- `<prefix>remindme list` to list the reminders you have." +
	"\n- `<prefix>remindme remove [number]` to remove a reminder on that list." +
	"\n-# Note: For specifying timezones, take a look at the [IANA timezone](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)." +
		" Though, you can make mistakes as you get suggestions from this command." +
	"\n-# This command only supports the Gregorian calendar.";
export async function execute(
	_client: Client,
	msg: Message,
	args: string[],
	external_data: ExternalDependencies
) {
	const reminder_emitter = external_data.reminder_emitter;
	const command = args.join(" ");
	
	try {
		const tokens = lexer.parse(command);
		// msg.reply(JSON.stringify(tokens, null, 4));
		const expr = parser.parse(command, tokens);
		// msg.reply(JSON.stringify(expr, null, 4));
		const res = reminder_emitter.runExpr(msg.author.id, expr);
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
				msg.reply({ embeds: [formatReminders(res.content)] });
				break;
			}

			default: {
				msg.reply("This is a bug. Internal unsupported action.");
			}
		}
	} catch (error) {
		// console.log(error);
		msg.reply(`#: ${error}`);
	}

	lexer.resetLexer();
	parser.resetParser();
}

// pagination.

function formatReminders(reminders: MainReminderCommand[]): EmbedBuilder {
	const embed = new EmbedBuilder()
		.setColor("White");

	if (reminders.length >= 1) {
		let index = 0;
		for (const reminder of reminders.slice(0, 10)) {
			if (reminder.command === "Remove" || reminder.command === "List") {
				continue; // how the hell did a remove or list command get in.
			}
			embed.addFields({ 
				name: `#${index} - ${formatFieldName(reminder)}`,
				value: limitString(reminder.message, 100),
				inline: true,
			});
			index++;
		}
		embed.setTitle("Your reminders.");
		embed.setFooter({text: "You can remove these by doing `??remindme remove [index]`"});
	} else {
		embed.setTitle("No reminders!");
	}
	return embed;
}

function formatFieldName(reminder: MainReminderCommand): string {
	const isRecurring = reminder.command === "Recurring";
	const command = isRecurring
		? "Recurring, " + reminder.content.type
		: reminder.command;
	if (reminder.command !== "Remove" && reminder.command !== "List") {
		const base = `${reminder.to_date.format("MMM DD YYYY hh:mm z")} ${reminder.to_date.fromNow()} (${command})`;
		return base;
	} else {
		throw new Error("Format field name error, reminder command is a remove/list instead of relative, absolute, or recurring.");
	}
}

function limitString(str: string, allowable_length: number) {
	return str.length > allowable_length
		? str.slice(0, allowable_length) + " ..."
		: str;
}

