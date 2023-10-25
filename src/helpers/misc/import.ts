import * as url from 'url';
import path from "path";
import chalk from "chalk";

import { readdirSync } from "fs";
import { CommandModule } from '../types.js';
import { Collection } from 'discord.js';

export async function importDirectories(
    dirname:       string, 
    selected_path: string,
) {
    const commands = new Collection<string, CommandModule>();
    const dir = url.pathToFileURL(path.join(dirname, selected_path));
    const specialCommandFiles = readdirSync(dir)
        .filter(file =>
            file.endsWith(".js"));
    for (const file of specialCommandFiles) {
        const command: CommandModule = await import(`${dir}\\${file}`);
        commands.set(command.name, command);
        console.log(`Imported ${chalk.green(file)}`);
    }
    return commands;
}

export function postprocessAliases(col: Collection<string, CommandModule>) {
	const aliases = new Map<string, string>();
	for (const [name, command] of col) {
		if (!command.aliases)
			continue;
		for (const alias of command.aliases) {
			aliases.set(alias, name);
		}
	}
	return aliases;
}
