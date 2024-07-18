import { Client } from "discord.js";
import EventEmitter from "node:events";

export type ReminderContents = {
	to_date: Date;
	contents: string;
};
type Reminders = Map<string, ReminderContents[]>;

export class ReminderEmitter {
	private reminders: Reminders = new Map();
	private reminder_event = new EventEmitter();
	constructor(client: Client<boolean>) {
		setInterval(() => {
			// global timer for the reminders.
			this.reminder_event.emit("tickPassed", this.reminders, client);
		}, 5000); // checks every 5 seconds.
	}

	activate() {
		this.reminder_event.on(
			"tickPassed",
			(user_reminders: Reminders, client: Client<true>) => {
				const current_date = new Date();

				const user_to_delete: string[] = [];
				for (const [userid, reminders] of user_reminders) {
					for (let i = reminders.length - 1; i >= 0; i--) {
						const reminder = reminders[i];

						if (current_date.getTime() < reminder.to_date.getTime()) {
							continue;
						}
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

				for (const u of user_to_delete) {
					this.reminders.delete(u);
				}
			}
		);
	}
	pushReminder(user_id: string, user_reminder: ReminderContents) {
		const reminder = this.reminders.get(user_id);
		if (reminder) {
			reminder.push(user_reminder);
			this.reminders.set(user_id, reminder);
		} else {
			this.reminders.set(user_id, [user_reminder]);
		}
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
