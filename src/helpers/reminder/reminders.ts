
import { Client } from "discord.js";
import Fuse, {FuseResult} from "fuse.js";
import EventEmitter from "node:events";

import dayjs, {Dayjs} from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat.js";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import relativeTime from "dayjs/plugin/relativeTime.js";

import {Absolute, Expr, Recurring, Relative, Remove} from "@helpers/reminder/parser.js";

dayjs.extend(advancedFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

import tz from "@media/timezone.json" assert { type: "json" };

const fuse = new Fuse(tz, {
	keys: ["tz_id"],
	includeScore: true,
	shouldSort: true,
});

export type MainReminderCommand = AbsoluteCommand | RecurringCommand | RelativeCommand
	| RemoveCommand | ListCommand;
type Reminders = Map<string, MainReminderCommand[]>;
type RelativeContent = {
	type: "Relative";
	d: number;
	h: number;
	m: number;
};
type AbsoluteContent = {
	type: "Absolute";
	year: number;
	month: number;
	date: number;
	hour: number;
	minute: number;
	timezone: string | "local";
};
type AbsoluteCommand = {
	command: "Absolute";
	to_date: Dayjs;
	content: AbsoluteContent;
	message: string;
};
type RecurringCommand = {
	command: "Recurring"
	to_date: Dayjs;
	content: AbsoluteContent | RelativeContent;
	message: string;
};
type RelativeCommand = {
	command: "Relative";
	to_date: Dayjs;
	content: RelativeContent;
	message: string;
};
type RemoveCommand = {
	command: "Remove";
	index: number;
}
type ListCommand = {
	command: "List";
}
function isMainRemindCommand(obj: object): obj is MainReminderCommand {
	return (obj as MainReminderCommand).command !== undefined;
}

// atrocious performance. 
// this loops through every single user and loops through their reminders,
// 		then picks out the reminders that are due.

export class ReminderEmitter {
	private reminders: Reminders = new Map();
	private reminder_event = new EventEmitter();
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
		const command = this.recursiveParse(input, time);
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
	private recursiveParse(input: Expr, time: Dayjs): MainReminderCommand | Expr {
		switch (input.type) {
			case "Relative": {
				const relative: RelativeContent = {
					type: "Relative",
					d: 0,
					h: 0,
					m: 0,
				};
				let result_time = time;
				const relative_expr = input as Relative;
				for (const unit of relative_expr.units) {
					switch (unit.unit) {
						case "d": 
							relative.d = unit.value;
							result_time = result_time.add(unit.value, "day");
							break;
						case "h": 
							relative.h = unit.value;
							result_time = result_time.add(unit.value, "hour"); 
							break;
						case "m": 
							relative.m = unit.value;
							result_time = result_time.add(unit.value, "minute"); 
							break;
						default: 
							throw new Error(`Unknown relative unit: "${unit.unit}"`);
					}
				}
				const time_difference = result_time.diff(dayjs(), "day", true);
				if (time_difference > 30) {
					throw new Error(`Too much time! You put in a reminder that triggers ${result_time.fromNow()}, it should be below 30 days.`);
				}
				return {
					command: "Relative",
					content: relative,
					to_date: result_time,
					message: relative_expr.content,
				};
			}
			case "Recurring": {
				const recurring = input as Recurring;
				if (recurring.expr.type !== "Relative") {
					throw new Error(`${recurring.expr.type} types not supported yet!`);
				}

				const command = this.recursiveParse(recurring.expr, time) as RelativeCommand;
				return {
					command: "Recurring",
					to_date: command.to_date,
					content: command.content,
					message: command.message,
				};
			}
			case "Absolute": {
				const expr = input as Absolute;
				const absolute: AbsoluteContent = {
					type: "Absolute",
					year: 0,
					month: 0,
					date: 0,
					hour: 0,
					minute: 0,
					timezone: expr.timezone,
				};
				const res = fuse.search(expr.timezone).slice(0, 2);
				if (!this.isValidTimezone(res)) {
					throw new Error(`Unknown timezone "${expr.timezone}", did you mean ${res.map(v => `"${v.item.tz_id}"`).join(", ")}`);
				}
				let result = time.tz(expr.timezone);
				for (const unit of expr.units) {
					switch (unit.unit) {
						case "Y": 
							absolute.year = unit.value;
							result = result.set("year", unit.value); 
							break;
						case "M": 
							absolute.month = unit.value;
							result = result.set("month", unit.value - 1); 
							break; // months are 0-indexed
						case "D": 
							absolute.date = unit.value;
							result = result.set("date", unit.value); 
							break;
						default: 
							throw new Error(`Unknown absolute unit: ${unit.unit}`);
					}
				}
				if (expr.clock) {
					const clock = expr.clock;
					if (clock.hour !== undefined) {
						absolute.hour = clock.hour;
						result = result.set("hour", clock.hour);
					} else {
						result = result.set("hour", 0);
					}
					if (clock.minute !== undefined) {
						absolute.minute = clock.minute;
						result = result.set("minute", clock.minute);
					} else {
						result = result.set("minute", 0);
					}
					if (clock.meridiem === "pm" && result.hour() < 12) {
						absolute.hour += 12;
						result = result.add(12, "hour");
					}
				}

				if (!result.isValid() || result.isBefore(dayjs().tz(expr.timezone))) {
					throw new Error("Cannot set reminder in the past.");
				}
				const time_difference = result.diff(dayjs().tz(expr.timezone), "year", true);
				if (time_difference > 2) {
					throw new Error(`Too much time! You put in a reminder that triggers ${result.fromNow()}!`);
				}

				return {
					command: "Absolute",
					to_date: result,
					content: absolute,
					message: expr.content
				};
			}
			case "Remove": {
				const expr = input as Remove;
				return {
					command: "Remove",
					index: expr.index
				};
			}
			case "List": {
				return {command: "List"};
			}
			case "Clock": {
				return input;
			}
			case "Literal": {
				return input;
			}

			default:
				throw new Error(`Unknown expression! This isn't supposed to happen, ${input}`);
		}
	}
	private isValidTimezone<T>(matches: FuseResult<T>[]): boolean {
		const not_exact_match_threshold = 0.001;
		if (matches.length <= 0) {
			return false;
		}
		const best = matches[0];
		if (best.score! >= not_exact_match_threshold) {
			return false;
		}
		return true;
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
				this.rescheduleRecurringReminder(userid, reminder);
			} else {
				this.popReminder(userid, index);
			}
		} catch (error) {
			this.reminders.delete(userid);
		}
	}

	private rescheduleRecurringReminder(userid: string, reminder: RecurringCommand) {
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
		/*
		buggy absolute logic.
		} else if (reminder.content.type === "Absolute") {
			const { month, date, hour, minute } = reminder.content;
			const timezone = reminder.content.timezone;

			// there must be at least one day to do a recurring reminder.
			let next = dayjs().tz(timezone)
				.set("hour", hour)
				.set("minute", minute)
				.set("second", 0)
				.set("millisecond", 0);

			if (month && date) {
				// Yearly recurrence
				next = next.set("month", month - 1).set("date", date);
				if (next.isBefore(dayjs().tz(timezone))) {
					next = next.add(1, "year");
				}
			} else if (date) {
				// Monthly recurrence
				next = next.set("date", date);
				if (next.isBefore(dayjs().tz(timezone))) {
					next = next.add(1, "month");
				}
			} else {
				throw new Error("Invalid recurring AbsoluteContent: missing date or month.");
			}

			reminder.to_date = next;
		}
		*/
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


