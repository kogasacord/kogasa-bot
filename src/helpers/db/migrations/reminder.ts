
import sql from "sql-template-tag";
import {Database} from "better-sqlite3";

export interface ReminderTable {
	id: number,
	user_id: string,
	type: "Relative" | "Absolute",
	message: string,
}
export interface RelativeContentTable {
	id: number,
	reminder_id: number,
	d: number,
	h: number,
	m: number,
	is_recurring: boolean,
}
export interface AbsoluteContentTable {
	id: number,
	reminder_id: number,
	year: number,
	month: number,
	date: number,
	hour: number,
	minute: number,
	timezone: string,
	is_recurring: boolean,
}

export function reminder(db: Database) {
	const addReminder = db.transaction(() => {
		db.prepare(sql`
			CREATE TABLE IF NOT EXISTS reminder (
				id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
				user_id TEXT NOT NULL,
				type TEXT CHECK (type IN ('Relative', 'Absolute')) NOT NULL,
				message TEXT NOT NULL,
				FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
			);
		`.sql).run();
		db.prepare(sql`
			CREATE TABLE IF NOT EXISTS relative_content (
				id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
				reminder_id INTEGER UNIQUE NOT NULL,
				d INTEGER NOT NULL,
				h INTEGER NOT NULL,
				m INTEGER NOT NULL,
				is_recurring INTEGER NOT NULL,
				FOREIGN KEY (reminder_id) REFERENCES reminder(id) ON DELETE CASCADE
			);
		`.sql).run();
		db.prepare(sql`
			CREATE TABLE IF NOT EXISTS absolute_content (
				id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
				reminder_id INTEGER UNIQUE NOT NULL,
				year INTEGER NOT NULL,
				month INTEGER NOT NULL,
				date INTEGER NOT NULL,
				hour INTEGER NOT NULL,
				minute INTEGER NOT NULL,
				timezone TEXT NOT NULL,
				is_recurring INTEGER NOT NULL,
				FOREIGN KEY (reminder_id) REFERENCES reminder(id) ON DELETE CASCADE
			);
		`.sql).run();
	});
	addReminder();
}
