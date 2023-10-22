import * as url from 'url';
import path from "path";
import chalk from "chalk";
import { readdirSync } from "fs";
import { Collection } from 'discord.js';
export async function importDirectories(dirname, selected_path) {
    const commands = new Collection();
    const dir = url.pathToFileURL(path.join(dirname, selected_path));
    const specialCommandFiles = readdirSync(dir)
        .filter(file => file.endsWith(".js"));
    for (const file of specialCommandFiles) {
        const command = await import(`${dir}\\${file}`);
        commands.set(command.name, command);
        console.log(`Imported ${chalk.green(file)}.`);
    }
    return commands;
}
