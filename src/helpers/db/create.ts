
import sqlite3, {Database} from "better-sqlite3";
import {creation} from "./migrations/creation";

type DBFn = (db: Database) => void;

export function createDatabase(path: ":memory:" | string): Database {
	const db = new sqlite3(path);
	db.pragma("foreign_keys = ON");
	db.pragma("journal_mode = WAL");
	db.pragma("cache_size = -2048");
	db.pragma("page_size = 4096");

	const db_version = (db.pragma("user_version") as [{ user_version: number }])[0].user_version;

	// this has to be in-order or else the migration script will DIE :sob: please please please
	const migrations: DBFn[] = [
		creation,
	];
	migrations
		.slice(db_version)
		.forEach((mig, index) => {
			const new_version = db_version + index + 1;
			db.transaction(() => mig(db))();
			db.pragma(`user_version = ${new_version}`);
			console.log(`Upgraded to version ${new_version}`);
		});

	console.log(`Running ${path === ":memory:" ? "test in-memory" : "public file system"} database "${path}". Tables on version ${db_version}.`);
	
	// how do i incrementally update from any existing database version?

	return db;
}



