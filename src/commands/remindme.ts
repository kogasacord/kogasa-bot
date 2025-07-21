import dayjs, {Dayjs} from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat.js";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import relativeTime from "dayjs/plugin/relativeTime.js";
import { APIEmbedField, Client, EmbedBuilder, Message } from "discord.js";
import Fuse from "fuse.js";

import tz from "@media/timezone.json" assert { type: "json" };
import { abbr_to_utc } from "@helpers/reminder/data.js";
import { ExternalDependencies } from "@helpers/helpers.js";
import { ReminderEmitter } from "@helpers/reminder/reminders.js";
import { ChannelScope } from "@helpers/types";

dayjs.extend(advancedFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

const fuse = new Fuse(tz, {
	keys: ["tz_id"],
	includeScore: true,
	shouldSort: true,
});


export const name = "remindme";
export const aliases = ["rme", "remind"];
export const cooldown = 8;
export const channel: ChannelScope[] = ["Guild", "DMs", "Thread"];
export const description = "Reminds you.";
export const extended_description =
	"\n**To add a reminder**" +
	"\n- `??remindme time [number]d[number]h[number]m [content]`" +
	"\n- `??remindme 2d1m Do the dishes`" +
	"\n- `??remindme date Y[number]M[number]D[number]-[number]:[number][AM|PM] [timezone] [content]`" +
	"\n- `??remindme date Y2026D10-5AM America Remind me at year 2026, current month, 10th day, at 5AM, timezone `" +
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
	// to be replaced by @helpers/reminders/parser.ts
}


