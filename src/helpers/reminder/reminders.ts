
import { Client } from "discord.js";
import EventEmitter from "node:events";

import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat.js";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import relativeTime from "dayjs/plugin/relativeTime.js";

import {Expr} from "@helpers/reminder/parser.js";
import {ReminderCommand, MainReminderCommand, RelativeCommand, AbsoluteCommand, RecurringCommand, AbsoluteContent} from "@helpers/reminder/command.js";

dayjs.extend(advancedFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

type Reminders = Map<string, MainReminderCommand[]>;
function isMainRemindCommand(obj: object): obj is MainReminderCommand {
	return (obj as MainReminderCommand).command !== undefined;
}

// atrocious performance. 
// this loops through every single user and loops through their reminders,
// 		then picks out the reminders that are due.

export class ReminderEmitter {
	private reminders: Reminders = new Map();
	private reminder_event = new EventEmitter();
	private command_maker = new ReminderCommand();
	constructor(client: Client<boolean>) {
		setInterval(() => {
			// global timer for the reminders.
			this.reminder_event.emit("tickPassed", this.reminders, client);
		}, 10 * 1000);
	}

	/**
	* Attaches the main reminding function to the global timer.
	*/
	public activate() {
		this.reminder_event.on("tickPassed", (user_reminders, client) => {
			for (const [userid, reminders] of user_reminders) {
				this.processUserReminders(userid, reminders, client);
			}
		});
	}

	/**
	* Used to run the expression from the parser.
	*
	* @param user_id - The id of the user to store reminders in.
	* @param input - The result of the parser.
	* @returns 
	*/
	public runExpr(user_id: string, input: Expr): { action: "push" | "pop" | "list", content: MainReminderCommand[] } {
		const time = dayjs();
		const command = this.command_maker.recursiveParse(input, time);
		if (!isMainRemindCommand(command)) {
			throw new Error("Something went horribly wrong. The interpreter only supports recurring, relative, and absolute reminders. Something changed in the parser.");
		}

		switch (command.command) {
			case "Absolute":
			case "Recurring":
			case "Relative": {
				this.pushReminder(user_id, command);
				return {
					action: "push",
					content: [],
				};
			}
			case "Remove": {
				const content = this.popReminder(user_id, command.index);
				return {
					action: "pop",
					content: content ? [content] : [],
				};
			}
			case "List": {
				return {
					action: "list",
					content: this.getReminderFromUser(user_id),
				};
			}

			default:
				throw new Error("Invalid command, how did you get here?");
		}
	}

	private processUserReminders(userid: string, reminders: MainReminderCommand[], client: Client<true>) {
		for (let i = reminders.length - 1; i >= 0; i--) {
			const reminder = reminders[i];

			if (reminder.command === "Remove" || reminder.command === "List") continue;

			// Timezone aware for absolute reminders
			const current_time = reminder.content.type === "Absolute"
				? dayjs.tz(dayjs().format(), (reminder.content as AbsoluteContent).timezone)
				: dayjs();

			if (reminder.to_date.isBefore(current_time) || reminder.to_date.isSame(current_time)) {
				this.handleReminderTrigger(userid, reminder, i, client);
			}
		}
	}

	private handleReminderTrigger(
		userid: string,
		reminder: Extract<MainReminderCommand, AbsoluteCommand | RelativeCommand | RecurringCommand>,
		index: number,
		client: Client<true>
	) {
		try {
			client.users.send(userid, `Reminder: ${reminder.message}`);

			if (reminder.command === "Recurring") {
				this.rescheduleRecurringReminder(reminder);
			} else {
				this.popReminder(userid, index);
			}
		} catch (error) {
			this.reminders.delete(userid);
		}
	}

	private rescheduleRecurringReminder(reminder: RecurringCommand) {
		if (reminder.content.type === "Relative") {
			const {d, h, m} = reminder.content;
			let newDate = reminder.to_date;
			if (d) newDate = newDate.add(d, "day");
			if (h) newDate = newDate.add(h, "hour");
			if (m) newDate = newDate.add(m, "minute");
			reminder.to_date = newDate;
		} else {
			throw new Error("Reminder type is not relative.");
		}
	}
	private pushReminder(user_id: string, user_reminder: MainReminderCommand) {
		if (!this.reminders.has(user_id)) {
			this.reminders.set(user_id, []);
		}
		const reminder = this.reminders.get(user_id)!;
		reminder.push(user_reminder);
	}
	private popReminder(user_id: string, index: number): MainReminderCommand | undefined {
		const reminder = this.reminders.get(user_id);
		if (reminder) {
			if (reminder.length >= 2) {
				// [element1, element2] // [e1, e2, e3, e4]
				return reminder.splice(index, 1).at(0);
			} else {
				// [element1]
				const contents = reminder.splice(index, 1).at(0);
				this.reminders.delete(user_id);
				return contents;
			}
		} else {
			return undefined;
		}
	}
	getReminderFromUser(user_id: string): MainReminderCommand[] {
		return this.reminders.get(user_id) ?? [];
	}
}

/**
 * Generates 32 bit FNV-1a hash from the given string.
 * As explained here: http://isthe.com/chongo/tech/comp/fnv/
 *
 * @param s {string} String to generate hash from.
 * @param [h] {number} FNV-1a hash generation init value.
 * @returns {number} The result integer hash.
 */
export function rehash(s: string): number {
	let base = 0x811c9dc5;
	for (let i = 0; i < s.length; i++) {
		base ^= s.charCodeAt(i);
		base +=
			(base << 1) + (base << 4) + (base << 7) + (base << 8) + (base << 24);
	}
	return base >>> 0;
}


