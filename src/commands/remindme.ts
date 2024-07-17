
import { ExternalDependencies } from "@helpers/helpers.js";
import { Client, Message } from "discord.js";
import { ChannelScope } from "@helpers/types";

const time_regex = /(?=\d+d|\d+h|\d+m)(?:(?<days>\d+)d)?(?:(?<hours>\d+)h)?(?:(?<minutes>\d+)m)?/g; 

export const name = "remindme";
export const aliases = ["rme"];
export const cooldown = 20;
export const channel: ChannelScope[] = ["Guild", "DMs"];
export const description = "Reminds you.";
export const extended_description =
	"- `??remindme 1h Do the dishes`\n- `??remindme 7d Get a first meal.`";
export async function execute(
	client: Client,
	msg: Message,
	args: string[],
	external_data: ExternalDependencies
) {
	const reminder_emitter = external_data.reminder_emitter;

	const query = args[0];
	const contents = args.slice(1).join(" ");
	const match = [...query.matchAll(time_regex)].at(0);
	if (match?.groups) {
		const days = isNaN(Number(match.groups.days)) ? 0 : Number(match.groups.days);
		const hours = isNaN(Number(match.groups.hours)) ? 0 : Number(match.groups.hours);
		const minutes = isNaN(Number(match.groups.minutes)) ? 0 : Number(match.groups.minutes);
		const to_date = new Date();
		addDayToDate(to_date, days);
		addHourToDate(to_date, hours);
		addMinuteToDate(to_date, minutes);

		let reminders = reminder_emitter.getReminderFromUser(msg.author.id);
		if (reminders && reminders.length >= 20) {
			msg.reply("You have too many reminders! Please wait them out.");
		}

		reminder_emitter.pushReminder(msg.author.id, { to_date, contents });
		reminders = reminder_emitter.getReminderFromUser(msg.author.id);

		const reminders_left = `You have ${20 - reminders!.length} reminders left.`;

		msg.reply(`I will remind you "${contents}" in ${days}days ${hours}hours ${minutes}minutes. ${reminders_left}`);
	} else {
		msg.reply("Your query is malformed. The valid way to do it is: `??remindme [number]d[number]h[number]m [Message]`\nAs an example: `??remindme 1h Among us.`");
	}
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
