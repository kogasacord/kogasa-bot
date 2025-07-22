
import { Client } from "discord.js";
import Fuse from "fuse.js";
import EventEmitter from "node:events";
import dayjs, {Dayjs} from "dayjs";
import {Absolute, Expr, Recurring, Relative, Remove} from "@helpers/reminder/parser.js";

import tz from "@media/timezone.json" assert { type: "json" };

const fuse = new Fuse(tz, {
	keys: ["tz_id"],
	includeScore: true,
	shouldSort: true,
});

type MainReminderCommand = AbsoluteCommand | RecurringCommand | RelativeCommand
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

export class ReminderEmitter {
	private reminders: Reminders = new Map();
	private reminder_event = new EventEmitter();
	constructor(client: Client<boolean>) {
		setInterval(() => {
			// global timer for the reminders.
			this.reminder_event.emit("tickPassed", this.reminders, client);
		}, 10 * 1000);
	}

	public parseExpr(user_id: string, input: Expr): { action: "push" | "pop" | "list", content: MainReminderCommand[] } {
		const time = dayjs();
		const command = this.recursiveParse(input, time);
		if (!isMainRemindCommand(command)) {
			throw new Error("Expression returned from recursive run.");
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
				return {
					command: "Relative",
					content: relative,
					to_date: result_time,
					message: relative_expr.content,
				};
			}
			case "Recurring": {
				const recurring = input as Recurring;
				if (["Relative", "Absolute"].includes(recurring.expr.type)) {
					const command = this.recursiveParse(recurring.expr, time) as RelativeCommand | AbsoluteCommand;
					return {
						command: "Recurring",
						to_date: command.to_date,
						content: command.content,
						message: command.message,
					};
				} else {
					throw new Error("Unknown recurring expression.");
				}
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
				if (!this.verifyTimezone(expr.timezone)) {
					throw new Error(`Unknown timezone "${expr.timezone}"`);
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
					}
					if (clock.minute !== undefined) {
						absolute.minute = clock.minute;
						result = result.set("minute", clock.minute);
					}
					if (clock.meridiem === "pm" && result.hour() < 12) {
						absolute.hour += 12;
						result = result.add(12, "hour");
					}
				}

				if (!result.isValid() || result.isBefore(dayjs().tz(expr.timezone))) {
					throw new Error("Cannot set reminder in the past, interpreter.");
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
	private verifyTimezone(str: string): boolean {
		const matches = fuse.search(str).slice(0, 4);
		console.log(`Timezone matches: ${JSON.stringify(matches, null, 4)}`);
		for (const match of matches) {
			if (match.score! > 0.001) {
				return true;
			}
		}
		return false;
	}

	activate() {
		this.reminder_event.on("tickPassed", (user_reminders, client) => {
			for (const [userid, reminders] of user_reminders) {
				this.processUserReminders(userid, reminders, client);
			}
		});
	}
	private processUserReminders(userid: string, reminders: MainReminderCommand[], client: Client<true>) {
		for (let i = reminders.length - 1; i >= 0; i--) {
			const reminder = reminders[i];

			if (reminder.command === "Remove" || reminder.command === "List") continue;

			// Timezone aware for absolute reminders
			const current_time = (reminder.command === "Absolute" || reminder.command === "Recurring" && reminder.content.type === "Absolute")
				? dayjs.tz(dayjs().format(), )
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
			const { d, h, m } = reminder.content;
			let newDate = reminder.to_date;
			if (d) newDate = newDate.add(d, "day");
			if (h) newDate = newDate.add(h, "hour");
			if (m) newDate = newDate.add(m, "minute");
			reminder.to_date = newDate;
		} else if (reminder.content.type === "Absolute") {
			const { month, date, hour, minute } = reminder.content;
			const timezone = reminder.content.timezone;
			if (!this.verifyTimezone(timezone)) {
				throw new Error(`Unknown timezone "${timezone}"`);
			}
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
	}
	pushReminder(user_id: string, user_reminder: MainReminderCommand) {
		if (!this.reminders.has(user_id)) {
			this.reminders.set(user_id, []);
		}
		const reminder = this.reminders.get(user_id)!;
		reminder.push(user_reminder);
	}
	popReminder(user_id: string, index: number): MainReminderCommand | undefined {
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


