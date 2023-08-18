import { Client, Collection, Message } from "discord.js";
import { CommandModule } from "../../helpers/types";

export const name = "help";
export const cooldown = 20;
export const special = true;
export const description = "Check what I can do."
export async function execute(
    client: Client,
    msg: Message,
    args: string[],
    commands: Collection<string, CommandModule>,
    prefix: string,
) {
    let reply = "## HELP! Bad Apple!\n\n";
    for (const command of commands) {
        reply += `\`${prefix}${command[0]}\` => \`${command[1].description ?? "No description provided."}\`\n`
    }
    msg.reply(reply);
}