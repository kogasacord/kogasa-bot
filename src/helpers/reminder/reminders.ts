import { Client } from "discord.js";
import EventEmitter from "node:events";
import dayjs, {Dayjs} from "dayjs";
import {Absolute, Expr, Recurring, Relative, Remove, List} from "@helpers/reminder/parser.js";

type Reminders = Map<string, ReminderContents[]>;
type MainReminderCommand = ReminderCommand | RemoveCommand | ListCommand;
export type ReminderContents = {
	to_date: Dayjs;
	contents: string;
	is_repeating: boolean;
	timezone: string | "local";
};
type RemoveContents = {
	index: number;
}
type ReminderCommand = {
	command: "Relative" | "Recurring" | "Absolute";
	reminder: ReminderContents;
}
type RemoveCommand = {
	command: "Remove";
	reminder: RemoveContents;
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

	public parseExpr(user_id: string, input: Expr) {
		const time = dayjs();
		const command = this.recursiveParse(input, time);
		if (!isMainRemindCommand(command)) {
			throw new Error("Expression returned from recursive run.");
		}

		switch (command.command) {
			case "Relative": {
				break;
			}
			case "Recurring": {
				break;
			}
			case "Absolute": {
				break;
			}
			case "Remove": {
				break;
			}
			case "List": {
				break;
			}

			default:
				break;
		}
	}
	private recursiveParse(input: Expr, time: Dayjs): MainReminderCommand | Expr {
		switch (input.type) {
			case "Relative": {
				const relative_expr = input as Relative;
				for (const unit of relative_expr.units) {
					switch (unit.unit) {
						case "d": time.add(unit.value, "day"); break;
						case "h": time.add(unit.value, "hour"); break;
						case "m": time.add(unit.value, "minute"); break;
						default: 
							throw new Error(`Unknown relative unit: "${unit.unit}"`);
					}
				}
				return {
					command: "Relative",
					reminder: {
						to_date: time,
						contents: relative_expr.content,
						is_repeating: false,
						timezone: "local"
					},
				};
			}
			case "Recurring": {
				const recurring = input as Recurring;
				if (["Relative", "Absolute"].includes(recurring.expr.type)) {
					const rme_contents = this.recursiveParse(recurring.expr, time) as ReminderCommand;
					rme_contents.command = "Recurring";
					rme_contents.reminder.is_repeating = true;
					return rme_contents;
				} else {
					throw new Error("Unknown recurring expression.");
				}
			}
			case "Absolute": {
				const expr = input as Absolute;
				let result = time;
				for (const unit of expr.units) {
					switch (unit.unit) {
						case "Y": result = result.set("year", unit.value); break;
						case "M": result = result.set("month", unit.value - 1); break; // months are 0-indexed
						case "D": result = result.set("date", unit.value); break;
						default: throw new Error(`Unknown absolute unit: ${unit.unit}`);
					}
				}
				if (expr.clock) {
					const clock = expr.clock;
					if (clock.hour !== undefined) result = result.set("hour", clock.hour);
					if (clock.minute !== undefined) result = result.set("minute", clock.minute);
					if (clock.meridiem === "pm" && result.hour() < 12) {
						result = result.add(12, "hour");
					}
				}

				return {
					command: "Absolute",
					reminder: {
						to_date: result,
						contents: expr.content,
						timezone: expr.timezone,
						is_repeating: false,
					},
				};
			}
			case "Remove": {
				const expr = input as Remove;
				return {
					command: "Remove",
					reminder: {
						index: expr.index
					}
				};
			}
			case "List": {
				const expr = input as List;
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

	activate() {
		this.reminder_event.on("tickPassed",
			(user_reminders: Reminders, client: Client<true>) => {
				const user_to_delete: string[] = [];

				for (const [userid, reminders] of user_reminders) {
					for (let i = reminders.length - 1; i >= 0; i--) {
						const reminder = reminders[i];
						const current_date = dayjs.tz(dayjs().format(), reminder.timezone);

						if (reminder.to_date.isAfter(current_date)) {
							try {
								client.users.send(userid, `Reminder: ${reminder.contents}`);
								if (reminders.length >= 2) {
									reminders.splice(i, 1);
								} else {
									user_to_delete.push(userid);
								}
							} catch (error) {
								this.reminders.delete(userid);
								// it just deletes the user's reminders if it can't DM them.
							}
						}
					}
				}

				for (const u of user_to_delete) {
					this.reminders.delete(u);
				}
			}
		);
	}
	pushReminder(user_id: string, user_reminder: ReminderContents) {
		if (!this.reminders.has(user_id)) {
			this.reminders.set(user_id, []);
		}
		const reminder = this.reminders.get(user_id)!;
		reminder.push(user_reminder);
	}
	popReminder(user_id: string, index: number): ReminderContents | undefined {
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
	getReminderFromUser(user_id: string): ReminderContents[] | undefined {
		return this.reminders.get(user_id);
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
