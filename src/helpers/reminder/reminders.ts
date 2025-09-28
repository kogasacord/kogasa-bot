
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
	constructor() {
		this.reminder_event.on("tickPassed", (user_reminders: Reminders, client: Client<true>) => {
			for (const [userid, reminders] of user_reminders) {
				this.processUserReminders(userid, reminders, client);
			}
		});
		this.reminder_event.on("backupDB", this.backupDB);
	}

	/**
	* Attaches the main reminding function and backup function to the global timer.
	*/
	public activate(client: Client<true>, db: Database, test: boolean) {
		setInterval(() => {
			this.reminder_event.emit("backupDB", client, db, this.reminders);
		}, 60 * 1000);
		setInterval(() => {
			if (test) {
				this.printReminders(client, db);
			}
			this.reminder_event.emit("tickPassed", this.reminders, client);
		}, 10 * 1000);
	}

	/**
	* Restores reminders from the database.
	*/
	public restoreRemindersFromDB(db: Database) {
		const reminders = db.transaction(() => {
			const get_reminder = db.prepare(sql`
				SELECT *
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

			const reminders = get_reminder.all() as ReminderTable[];
			for (const reminder of reminders) {
				if (reminder.type === "Relative") {
					const relative = get_relative.get(reminder.id) as RelativeContentTable;
					const rme_content: RelativeContent = {
						"d": relative.d,
						"h": relative.h,
						"m": relative.m,
						"type": "Relative",
					};
					const rme_absolute: RelativeCommand | RecurringCommand = {
						"command": relative.is_recurring ? "Recurring" : "Relative",
						"content": rme_content,
						"message": reminder.message,
						"to_date": dayjs(relative.to_date),
					};
					this.pushReminder(reminder.user_id, rme_absolute);
				}
				if (reminder.type === "Absolute") {
					const absolute = get_absolute.get(reminder.id) as AbsoluteContentTable;
					const rme_content: AbsoluteContent = {
						"year": absolute.year,
						"month": absolute.month,
						"date": absolute.date,
						"hour": absolute.hour,
						"minute": absolute.minute,
						"timezone": absolute.timezone,
						"type": "Absolute",
					}
					const rme_absolute: AbsoluteCommand | RecurringCommand = {
						"command": absolute.is_recurring ? "Recurring" : "Absolute",
						"content": rme_content,
						"message": reminder.message,
						"to_date": dayjs(absolute.to_date).tz(absolute.timezone),
					};
					this.pushReminder(reminder.user_id, rme_absolute);
				}
			}

		});
		reminders();
	}

	private printReminders(client: Client<true>, db: Database) {
		const get_reminder = db.prepare(sql`
			SELECT *
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
		const db_reminder = get_reminder.all() as ReminderTable[];
		const reminders = db_reminder.map((v) => {
			if (v.type === "Absolute") {
				const absolute = get_absolute.get(v.id) as AbsoluteContentTable;
				return absolute;
			}
			if (v.type === "Relative") {
				const relative = get_relative.get(v.id) as RelativeContentTable;
				return relative;
			}
			throw new Error(`debug: not supposed to be here. ${JSON.stringify(v)}`);
		});
		client.users.createDM("509683395224141827")
			.then(v => { v.send(JSON.stringify(reminders, null, 4)) })
			.catch(console.log);
	}

	private backupDB(client: Client<true>, db: Database, user_reminders: Reminders) {
		const backup = db.transaction((user_reminders: Reminders) => {
			const insert_user_if_exists = db.prepare(sql`
				INSERT OR IGNORE INTO users (id, name)
				VALUES (@id, @name)
			`.sql);
			const insert_reminder = db.prepare<Pick<ReminderTable, "user_id" | "type" | "message">>(sql`
				INSERT INTO reminder (user_id, type, message)
				VALUES (@user_id, @type, @message)
				RETURNING id
			`.sql);
			const insert_relative = db.prepare<Omit<RelativeContentTable, "id">>(sql`
				INSERT INTO relative_content (
					reminder_id,
					d, h, m,
					to_date,
					is_recurring
				)
				VALUES (
					@reminder_id,
					@d, @h, @m,
					@to_date,
					@is_recurring
				)
			`.sql);
			const insert_absolute = db.prepare<Omit<AbsoluteContentTable, "id">>(sql`
				INSERT INTO absolute_content (
					reminder_id,
					year, month, date,
					hour, minute,
					timezone,
					to_date,
					is_recurring
				)
				VALUES (
					@reminder_id,
					@year, @month, @date,
					@hour, @minute,
					@timezone,
					@to_date,
					@is_recurring
				)
			`.sql);

			// perf issue: this deletes everything 
			// 		in the database and puts it back.
			// I have no way to track what's in the database and what isn't
			// 		without a "reminder id" for this class and the reminder table.
			//
			// This isn't a massive cause for concern due to low traffic
			// but im leaving this note in case this becomes a problem.
			[
				sql`DELETE FROM reminder`.sql,
				sql`DELETE FROM sqlite_sequence WHERE name='reminder'`.sql,
				sql`DELETE FROM sqlite_sequence WHERE name='relative_content'`.sql,
				sql`DELETE FROM sqlite_sequence WHERE name='absolute_content'`.sql,
			].map(v => db.prepare(v).run());

			for (const [user_id, reminders] of user_reminders) {
				const user = client.users.cache.get(user_id);
				insert_user_if_exists.run({ id: user_id, name: user?.username ?? "unknown" })

				for (const reminder of reminders) {
					const rme = reminder as RecurringCommand | RelativeCommand | AbsoluteCommand;
					const is_recurring = rme.command === "Recurring";
					const reminder_record = insert_reminder.get({
						user_id: user_id, 
						type: rme.content.type,
						message: rme.message,
					}) as Pick<ReminderTable, "id">;
					if (rme.content.type === "Relative") {
						insert_relative.run({
							reminder_id: reminder_record.id,
							d: rme.content.d,
							h: rme.content.h,
							m: rme.content.m,
							is_recurring: is_recurring ? 1 : 0,
							to_date: rme.to_date.toISOString()
						});
					}
					if (rme.content.type === "Absolute") {
						insert_absolute.run({
							year: rme.content.year,
							month: rme.content.month,
							date: rme.content.date,
							hour: rme.content.hour,
							minute: rme.content.minute,
							timezone: rme.content.timezone,
							reminder_id: reminder_record.id,
							is_recurring: is_recurring ? 1 : 0,
							to_date: rme.to_date.toISOString()
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
		const priorities = [content.year, content.month, content.date, content.hour, content.minute];
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


