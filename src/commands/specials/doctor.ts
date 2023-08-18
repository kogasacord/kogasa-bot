import { Client, Collection, Message } from "discord.js";
import { CommandModule } from "../../helpers/types";

export const name = "doctor";
export const cooldown = 20;
export const special = true;
export const description = "Send me to Eirin and let them check my health. [Not implemented.]"
export async function execute(
    client: Client,
    msg: Message,
    args: string[],
    commands: Collection<string, CommandModule>,
) {
    msg.reply("Currently in the works.")
}
// check the different HTTPS and commands