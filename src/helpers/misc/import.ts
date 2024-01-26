import * as url from "url";
import path from "path";

import { readdirSync } from "fs";
import { CommandModule } from "../types.js";
import { Collection } from "discord.js";

export async function importDirectories(
	dirname: string,
	selected_path: string
) {
	const commands = new Collection<string, CommandModule>();
	const dir = url.pathToFileURL(path.join(dirname, selected_path));
	const specialCommandFiles = readdirSync(dir).filter((file) =>
		file.endsWith(".js")
	);
	for (const file of specialCommandFiles) {
		console.time(`${file}`);
		const command: CommandModule = await import(`${dir}\\${file}`);

		try {
			recheck_fields(command);
			commands.set(command.name, command);
		} catch (err) {
			console.log(err);
		}
		console.timeEnd(`${file}`);
	}
	return commands;
}

function recheck_fields(command: CommandModule) {
		if (command.name === undefined) {
			throw new Error("Name missing for a command..");
		}
		if (command.channel !== "DMs" && command.channel !== "Guild") {
			throw new Error(`Channel missing or mispelled for ${command.name}, "${command.channel}"`);
		}
		if (command.cooldown === undefined) {
			throw new Error(`Cooldown missing for ${command.name}`);
		}
		if (command.description === undefined) {
			throw new Error(`Description missing for ${command.name}`);
		}
		if (command.execute === undefined) {
			throw new Error(`Execute function missing for ${command.name}`);
		}
}

/*
 * Maps aliases to the original command like so:
 * 	{ "<aliases here>": "<original command here>" }
 */
export function postProcessAliases(col: Collection<string, CommandModule>) {
	const aliases = new Map<string, string>();
	for (const [name, command] of col) {
		if (!command.aliases) continue;
		for (const alias of command.aliases) {
			aliases.set(alias, name);
		}
	}
	return aliases;
}
