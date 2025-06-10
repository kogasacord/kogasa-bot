
import sqlite3, {Database} from "better-sqlite3";
import sql from "sql-template-tag";

export function createDatabase(path: ":memory:" | string): Database {
	const db = new sqlite3(path);
	db.pragma("foreign_keys = ON");
	db.pragma("journal_mode = WAL");
	db.pragma("cache_size = -2048");
	db.pragma("page_size = 4096");
	db.pragma("user_version = 1");

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
				id TEXT NOT NULL PRIMARY KEY,
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
				id TEXT NOT NULL PRIMARY KEY,
				confession_number INTEGER NOT NULL,
				timestamp DATE NOT NULL,
				confess_channel_id TEXT NOT NULL,
				guild_user_id TEXT NOT NULL,

				FOREIGN KEY (confess_channel_id)
					REFERENCES confess_channel (id),
				FOREIGN KEY (guild_user_id)
					REFERENCES guild_user (id)
			)
		`.sql).run();
	});
	createTables();
	/* eslint-disable  @typescript-eslint/no-explicit-any */
	const user_version = db.pragma("user_version") as any;
	console.log(`Running ${path === ":memory:" ? "in-memory" : "file system"} database "${path}". Tables on version ${user_version[0].user_version}.`);

	return db;
}
