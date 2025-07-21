import { Client } from "discord.js";
import EventEmitter from "node:events";
import dayjs, {Dayjs} from "dayjs";
import {Absolute, Expr, Literal, Recurring, Relative} from "@helpers/reminder/parser.js";

export type ReminderContents = {
	to_date: Dayjs;
	contents: string;
	is_repeating: boolean;
	timezone: string | "local";
}; // this is used in a loop to periodically check if to_date has passed Date.now()
type Reminders = Map<string, ReminderContents[]>;
// Reminders gets looped through in order to check every user
// It's a map because I want to get the ReminderContents via string


export class ReminderEmitter {
	private reminders: Reminders = new Map();
	private reminder_event = new EventEmitter();
	constructor(client: Client<boolean>) {
		setInterval(() => {
			// global timer for the reminders.
			this.reminder_event.emit("tickPassed", this.reminders, client);
		}, 10 * 1000);
	}

	public run(user_id: string, input: Expr) {
		const time = dayjs();
		this.recursiveRun(user_id, input, time);
	}
	private recursiveRun(user_id: string, input: Expr, time: Dayjs) {
		switch (input.type) {
			case "Relative": {
				const relative_expr = input as Relative;
				for (const unit of relative_expr.units) {
					const lit = this.recursiveRun(user_id, unit, time) as Literal;
					switch (lit.unit) {
						case "d": time.add(lit.value, "day"); break;
						case "h": time.add(lit.value, "hour"); break;
						case "m": time.add(lit.value, "minute"); break;
						default: 
							throw new Error(`Unknown relative unit: "${lit.unit}"`);
					}
				}
				this.pushReminder(user_id, {
					to_date: time,
					contents: relative_expr.content,
					is_repeating: false,
					timezone: "local"
				});
				break;
			}
			case "Recurring": {
				const recurring = input as Recurring;
				const expr = this.recursiveRun(user_id, recurring.expr, time);
				switch (recurring.expr.type) {
					case "Absolute":
						const abs_expr = expr as Absolute;
						abs_expr.content;
						break;
					case "Relative":
						const rel_expr = expr as Relative;
						break;

					default:
						break;
				}
				break;
			}
			case "Absolute": {
				break;
			}
			case "Clock": {
				return input;
			}
			case "Literal": {
				return input;
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
