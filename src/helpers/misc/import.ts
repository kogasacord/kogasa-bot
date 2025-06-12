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
	const commands = new Collection<string, CommandModule>();
	const dir = url.pathToFileURL(path.join(dirname, selected_path));
	const specialCommandFiles = readdirSync(dir).filter((file) =>
		file.endsWith(".js")
	);
	for (const file of specialCommandFiles) {
		console.time(`${file}`);
		const command: CommandModule = await import(`${dir}\\${file}`);

		try {
			commands.set(command.name, command);
		} catch (err) {
			console.log(err);
		}
		console.timeEnd(`${file}`);
	}


	return commands;
}

export function commandsValidationCheck(commands: Collection<string, CommandModule>) {
	const list_aliases = new Map<string, string>();
	const duplicate_aliases: Alias[] = [];

	const err = "";
	for (const [_, command] of commands) {
		// alias check.
		aliasCheck(list_aliases, duplicate_aliases, err);
		recheckFields(command, err);
	}
	
	if (err.length > 0) {
		throw new Error(err);
	}
}

function aliasCheck(
	list_aliases: Map<string, string>, 
	duplicate_aliases: Alias[], 
	err: string
) {
	for (const { name, alias } of duplicate_aliases) {
		const command_name = list_aliases.get(alias);
		if (command_name) {
			const n = `Alias Error: ${command_name}'s command has a duplicate command with alias: ${alias}\n`;
			err += n;
		}
	}
}

function recheckFields(command: CommandModule, err: string) {
	const dm: ChannelScope[] = ["DMs", "Guild", "Thread"];

	if (command.name === undefined) {
		err += "Name missing for a command.";
	}
	if (!command.channel.every((v) => dm.includes(v))) {
		err += `Channel missing or mispelled for ${command.name}, "${command.channel}"`;
	}
	if (command.cooldown === undefined) {
		err += `Cooldown missing for ${command.name}`;
	}
	if (command.description === undefined) {
		err += `Description missing for ${command.name}`;
	}
	if (command.execute === undefined) {
		err += `Execute function missing for ${command.name}`;
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
