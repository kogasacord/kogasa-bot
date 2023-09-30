import fetch from "node-fetch";
import { Client, Message } from "discord.js";

export const name = "chat";
export const cooldown = 40;
export const description = "Chat with Kogasa! (Model: Base Llama2 7B)"
export async function execute(client: Client, msg: Message, args: string[]) {
    msg.reply("This feature is currently disabled so I can scope message history for users only.")
    return;

    const user_message = args.join(" ");
    if (user_message.length <= 0) {
        msg.reply("Send me a message!")
        return;
    }
    if (user_message.length > 200) {
        msg.reply("Your message is too long.")
        return;
    }
    await msg.channel.sendTyping()
    const llama_response = await messageLlama2B(user_message)
    msg.reply(llama_response.response);
}


export async function messageLlama2B(msg: string) {
    const llama = await fetch("http://localhost:5000/", {
        method: "POST",
        body: JSON.stringify({ msg: msg }),
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    });
    return await llama.json() as { response: string };
}
