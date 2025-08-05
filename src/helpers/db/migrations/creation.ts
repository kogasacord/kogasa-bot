
import sql from "sql-template-tag";
import {Database} from "better-sqlite3";

export function creation(db: Database) {
	const createTables = db.transaction(() => {
		db.prepare(sql`
			CREATE TABLE IF NOT EXISTS users (
				id TEXT NOT NULL PRIMARY KEY,
				name TEXT NOT NULL
			)
		`.sql).run();
		db.prepare(sql`
			CREATE TABLE IF NOT EXISTS guild (
			   id TEXT NOT NULL PRIMARY KEY,
			   name TEXT NOT NULL
			)
		`.sql).run();
		db.prepare(sql`
			CREATE TABLE IF NOT EXISTS guild_user (
				id TEXT NOT NULL PRIMARY KEY,
				name TEXT NOT NULL,
				confess_banned BOOLEAN NOT NULL,
				user_id TEXT NOT NULL,
				guild_id TEXT NOT NULL,

				FOREIGN KEY (user_id)
					REFERENCES users (id),
				FOREIGN KEY (guild_id)
					REFERENCES guild (id)
			)
		`.sql).run();
		db.prepare(sql`
			CREATE TABLE IF NOT EXISTS confess_channel (
				id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL,
				count INTEGER NOT NULL,
				channel_id TEXT NOT NULL,
				guild_id TEXT NOT NULL,

				FOREIGN KEY (guild_id)
					REFERENCES guild (id)
			)
		`.sql).run();
		db.prepare(sql`
			CREATE TABLE IF NOT EXISTS confession (
				id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
				confession_number INTEGER NOT NULL,
				timestamp DATE NOT NULL,
				confess_channel_id INTEGER NOT NULL,
				guild_user_id TEXT NOT NULL,

				FOREIGN KEY (confess_channel_id)
					REFERENCES confess_channel (id) ON DELETE CASCADE
				FOREIGN KEY (guild_user_id)
					REFERENCES guild_user (id)
			)
		`.sql).run();
	});
	createTables();
}
