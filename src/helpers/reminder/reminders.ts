
import { Client } from "discord.js";
import sql from "sql-template-tag";
import EventEmitter from "node:events";

import { Database } from "better-sqlite3";

import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat.js";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import relativeTime from "dayjs/plugin/relativeTime.js";

import {Expr} from "@helpers/reminder/parser.js";
import {ReminderCommand, MainReminderCommand, RelativeCommand, AbsoluteCommand, RecurringCommand, AbsoluteContent, RelativeContent} from "@helpers/reminder/command.js";
import {AbsoluteContentTable, RelativeContentTable, ReminderTable} from "@helpers/db/migrations/reminder";

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
	constructor(client: Client<boolean>, db: Database) {
		setInterval(() => {
			// global timer for the reminders.
			this.reminder_event.emit("tickPassed", this.reminders, client);
		}, 10 * 1000);
		setInterval(() => {
			// global timer for db backups
			this.reminder_event.emit("backupDB", this.reminders, db);
		}, 60 * 1000);
	}

	/**
	* Attaches the main reminding function to the global timer.
	*/
	public activate() {
		this.reminder_event.on("tickPassed", (user_reminders: Reminders, client: Client<true>) => {
			for (const [userid, reminders] of user_reminders) {
				this.processUserReminders(userid, reminders, client);
			}
		});
	}
	/**
	* Attaches the function for persistent reminders.
	*/
	public activateDatabase() {
		this.reminder_event.on("backupDB", this.backupDB);
	}

	private restoreRemindersFromDB(db: Database) {
		const reminders = db.transaction(() => {
			const get_reminder = db.prepare(sql`
				SELECT id, user_id, type 
				FROM reminder 
			`.sql);
			const get_relative = db.prepare<number>(sql`
				SELECT *
				FROM relative_content
				WHERE reminder_id = ?
				LIMIT 1
			`.sql);
			const get_absolute = db.prepare<number>(sql`
				SELECT *
				FROM absolute_content
				WHERE reminder_id = ?
				LIMIT 1
			`.sql);
			const reminders = get_reminder.all() as Pick<ReminderTable, "id" | "user_id" | "type">[];
			for (const reminder of reminders) {
				if (reminder.type === "Relative") {
					// display relative from get_relative
					const relative = get_relative.get(reminder.id) as RelativeContentTable;
					// somehow sort that index.
					this.pushReminder(reminder.user_id, { index: 0 });
					this.reminders.set(, value)
				}
				if (reminder.type === "Absolute") {
					// display absolute from get_absolute
					const absolute = get_absolute.get(reminder.id) as AbsoluteContentTable;
				}
			}
		});
	}

	private backupDB(user_reminders: Reminders, db: Database) {
		const backup = db.transaction((user_reminders: Reminders) => {
			const insert_reminder = db.prepare<Pick<ReminderTable, "user_id" | "type" | "message">>(sql`
				INSERT reminder (user_id, type, message)
				VALUES (@user_id, @type, @message)
				RETURNING id
			`.sql);
			const insert_relative = db.prepare<Omit<RelativeContentTable, "id">>(sql`
				INSERT relative_content (
					reminder_id,
					d, h, m,
					is_recurring
				)
				VALUES (
					@reminder_id,
					@d, @h, @m,
					@is_recurring
				)
			`.sql);
			const insert_absolute = db.prepare<Omit<AbsoluteContentTable, "id">>(sql`
				INSERT absolute_content (
					reminder_id,
					year, month, date,
					hour, minute,
					timezone,
					is_recurring
				)
				VALUES (
					@reminder_id,
					@year, @month, @date,
					@hour, @minute,
					@timezone,
					@is_recurring
				)
			`.sql);
			const delete_table = db.prepare(sql`DELETE FROM reminder`.sql);

			// perf issue: this deletes everything 
			// 		in the database and puts it back.
			// I have no way to track what's in the database and what isn't
			// 		without a "reminder id" for this class and the reminder table.
			//
			// This isn't a massive cause for concern due to low traffic
			// but im leaving this note in case this becomes a problem.
			delete_table.run();

			for (const [user_id, reminders] of user_reminders) {
				for (const reminder of reminders) {
					const rme = reminder as RecurringCommand | RelativeCommand | AbsoluteCommand;
					const is_recurring = reminder.command === "Recurring";
					if (rme.command === "Relative") {
						const reminder = insert_reminder.get({
							user_id: user_id, 
							type: rme.command,
							message: rme.message,
						}) as Pick<ReminderTable, "id">;
						insert_relative.run({
							reminder_id: reminder.id,
							d: rme.content.d,
							h: rme.content.h,
							m: rme.content.m,
							is_recurring: is_recurring,
						});
					}
					if (rme.command === "Absolute") {
						const reminder = insert_reminder.get({
							user_id: user_id, 
							type: rme.command,
							message: rme.message,
						}) as Pick<ReminderTable, "id">;
						insert_absolute.run({
							"year": rme.content.year,
							"month": rme.content.month,
							"date": rme.content.date,
							"hour": rme.content.hour,
							"minute": rme.content.minute,
							"timezone": rme.content.timezone,
							"reminder_id": reminder.id,
							"is_recurring": is_recurring,
						});
					}
				}
			}
		});
		backup(user_reminders);
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
				? dayjs().tz((reminder.content as AbsoluteContent).timezone)
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
			this.recurringRelativeReminder(reminder);
		} else {
			throw new Error("Reminder type is not relative.");
		}
	}
	private recurringRelativeReminder(reminder: RecurringCommand) {
		const {d, h, m} = reminder.content as RelativeContent;
		let newDate = reminder.to_date;
		if (d) newDate = newDate.add(d, "day");
		if (h) newDate = newDate.add(h, "hour");
		if (m) newDate = newDate.add(m, "minute");
		reminder.to_date = newDate;
	}
	private recurringAbsoluteReminder(reminder: RecurringCommand) {
		const content = reminder.content as AbsoluteContent;
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


