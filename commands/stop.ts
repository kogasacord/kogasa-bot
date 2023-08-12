import { Client, Message } from "discord.js";


export const name = "stop";
export const cooldown = 5;
export async function execute(client: Client, msg: Message) {
    if (msg.author.id === "509683395224141827") {
        msg.reply("My work here is done.");
        process.exit();
    }
}