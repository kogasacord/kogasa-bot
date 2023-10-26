import { Client, Message } from "discord.js";
import {pingURL} from "../helpers/misc/ping.js";

export const name = "ping";
export const aliases = ["pong"]
export const cooldown = 25;
export const description = "Test command."
export async function execute(client: Client, msg: Message, args: string[]) {
    msg.reply(`Pong. If you want to check if the bot's still running, you can get better results in \`??doctor\`.`);
}

