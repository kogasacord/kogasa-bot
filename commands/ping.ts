import { Client, Message } from "discord.js";


export const name = "ping";
export const cooldown = 5;
export async function execute(client: Client, msg: Message) {
    msg.reply("Pong.")
}