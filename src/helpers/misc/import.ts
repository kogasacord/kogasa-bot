import * as url from "url";
import path from "path";

import { readdirSync } from "fs";
import { ChannelScope, CommandModule } from "../types.js";
import { Collection } from "discord.js";

type Alias = {
	name: string,
	alias: string,
}

export async function importCommandsFromDirectory(
	dirname: string,
	selected_path: string
) {
	const list_aliases = new Map<string, string>();
	const duplicate_aliases: Alias[] = [];

	const commands = new Collection<string, CommandModule>();
	const dir = url.pathToFileURL(path.join(dirname, selected_path));
	const specialCommandFiles = readdirSync(dir).filter((file) =>
		file.endsWith(".js")
	);
	for (const file of specialCommandFiles) {
		console.time(`${file}`);
		const command: CommandModule = await import(`${dir}\\${file}`);

		try {
			recheck_fields(command, list_aliases, duplicate_aliases);
			commands.set(command.name, command);
		} catch (err) {
			console.log(err);
		}
		console.timeEnd(`${file}`);
	}

	let str = "";
	for (const { name, alias } of duplicate_aliases) {
		const command_name = list_aliases.get(alias);
		if (command_name) {
			const n = `${command_name}'s command has a duplicate command with alias: ${alias}\n`;
			str += n;
		}
	}
	if (duplicate_aliases.length >= 0) {
		throw new Error(str);
	}

	return commands;
}

function recheck_fields(
	command: CommandModule,
	list_aliases: Map<string, string>,
	duplicate_aliases: Alias[]
) {
	const dm: ChannelScope[] = ["DMs", "Guild", "Thread"];

	if (command.name === undefined) {
		throw new Error("Name missing for a command..");
	}
	if (!command.channel.every((v) => dm.includes(v))) {
		throw new Error(
			`Channel missing or mispelled for ${command.name}, "${command.channel}"`
		);
	}
	for (const alias of command.aliases ?? []) {
		if (!list_aliases.has(alias)) {
			list_aliases.set(alias, command.name);
		} else {
			duplicate_aliases.push({ name: command.name, alias });
		}
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
