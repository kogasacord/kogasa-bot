import { Client, Message } from "discord.js";

export const name = "ping";
export const aliases = ["pong"];
export const cooldown = 25;
export const description = "Test command.";
export async function execute(client: Client, msg: Message) {
	msg.reply("I'm moving somewhere else.");
}
