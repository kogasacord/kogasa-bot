import { ExternalDependencies } from "@helpers/helpers.js";
import { APIEmbedField, Client, EmbedBuilder, Message } from "discord.js";
import { ChannelScope } from "@helpers/types";
import { ReminderEmitter } from "@helpers/reminder/reminders";

const time_regex =
	/(?=\d+d|\d+h|\d+m)(?:(?<days>\d+)d)?(?:(?<hours>\d+)h)?(?:(?<minutes>\d+)m)?/g;

export const name = "remindme";
export const aliases = ["rme", "remind"];
export const cooldown = 8;
export const channel: ChannelScope[] = ["Guild", "DMs"];
export const description = "Reminds you of a specific thing.";
export const extended_description =
	"\n**To add a reminder**" +
	"\n- `??remindme [number]d[number]h[number]m`" +
	"\n- `??remindme 1h Do the dishes`" +
	"\n- `??remindme 7d Get a first meal.`" +
	"\n**To delete a reminder**" +
	"\n- `??remindme remove` to list the reminders you have." +
	"\n- `??remindme remove [number]` to remove a reminder on that list.";
export async function execute(
	_client: Client,
	msg: Message,
	args: string[],
	external_data: ExternalDependencies
) {
	const reminder_emitter = external_data.reminder_emitter;
	const query = args[0];
	if (query && query.length <= 0) {
		msg.reply(
			"Please consult `??help remindme` for more information regarding this command."
		);
		return;
	}

	if (query === "remove") {
		userRemoveReminder(msg, reminder_emitter, args);
	} else {
		userAddReminder(msg, reminder_emitter, args);
	}
}

function userRemoveReminder(
	msg: Message,
	reminder_emitter: ReminderEmitter,
	args: string[]
) {
	const user_id = msg.author.id;
	const index = Number(args.at(1));

	if (isNaN(index) || !args.at(1)) {
		msg.reply({ embeds: [listReminders(reminder_emitter, user_id)] });
		return;
	}
	// remove reminder
	const reminder = reminder_emitter.popReminder(user_id, Math.abs(index - 1));
	if (reminder) {
		msg.reply(
			`Removed the reminder scheduled at ${reminder.to_date.toUTCString()}.`
		);
	} else {
		msg.reply("Unable to remove the reminder you selected.");
	}
}
function listReminders(
	reminder_emitter: ReminderEmitter,
	user_id: string
): EmbedBuilder {
	const reminder_contents = reminder_emitter.getReminderFromUser(user_id);
	const embed = new EmbedBuilder();
	if (!reminder_contents) {
		embed.setTitle("No reminders found.");
		return embed;
	}
	embed.setTitle("Reminders:");
	const embed_fields: APIEmbedField[] = [];
	for (let i = 0; i < reminder_contents.length; i++) {
		const r = reminder_contents[i];
		embed_fields.push({
			name: `${i + 1}) ${r.to_date.toUTCString()}`,
			value: r.contents,
		});
	}
	embed.addFields(embed_fields);
	return embed;
}

function userAddReminder(
	msg: Message,
	reminder_emitter: ReminderEmitter,
	args: string[]
) {
	const query = args.at(0);
	if (!query) {
		return;
	}

	const contents = args.slice(1).join(" ");
	const match = [...query.matchAll(time_regex)].at(0);
	if (!match?.groups) {
		msg.reply(
			"Your query is malformed. The valid way to do it is: `??remindme [number]d[number]h[number]m [Message]`\nAs an example: `??remindme 1h Among us.`"
		);
		return;
	}

	const days = isNaN(Number(match.groups.days)) ? 0 : Number(match.groups.days);
	const hours = isNaN(Number(match.groups.hours))
		? 0
		: Number(match.groups.hours);
	const minutes = isNaN(Number(match.groups.minutes))
		? 0
		: Number(match.groups.minutes);

	if (days >= 7) {
		msg.reply("Days specified was more than 7.");
		return;
	}
	if (hours >= 24) {
		msg.reply("Hours specified was more than 24.");
		return;
	}
	if (minutes >= 60) {
		msg.reply("Minutes specified was more than 60.");
		return;
	}

	const to_date = new Date();
	addDayToDate(to_date, days);
	addHourToDate(to_date, hours);
	addMinuteToDate(to_date, minutes);

	let reminders = reminder_emitter.getReminderFromUser(msg.author.id);
	if (reminders && reminders.length >= 20) {
		msg.reply(
			"You have too many reminders! Remove excess reminders using `??remindme remove`"
		);
	}

	reminder_emitter.pushReminder(msg.author.id, { to_date, contents });
	reminders = reminder_emitter.getReminderFromUser(msg.author.id);

	const reminders_left = `You have ${20 - reminders!.length} reminders left.`;

	msg.reply(
		`I will remind you "${contents}" in ${days} days ${hours} hours ${minutes} minutes. ${reminders_left}`
	);
}

function addDayToDate(date: Date, days: number) {
	date.setUTCDate(date.getUTCDate() + days);
	return date;
}
function addHourToDate(date: Date, hours: number) {
	date.setUTCHours(date.getUTCHours() + hours);
	return date;
}
function addMinuteToDate(date: Date, minutes: number) {
	date.setUTCMinutes(date.getUTCMinutes() + minutes);
	return date;
}
