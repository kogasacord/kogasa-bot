import { Client, Message } from "discord.js";

export const name = "dyn";
export const cooldown = 5;
export const description = "Test method to check dynamic cooldowns."
export async function execute(client: Client, msg: Message, args: string[]) {
    if (!args[0]) {
        msg.reply("No found duration to calculate.")
        return;
    }

    msg.reply(`Pong. ${testDuration(Number(args[0])) + cooldown}`);
}

export async function dyn_cooldown(args: string[]): Promise<number> {
    if (!args[0]) {
        return 0;
    }
    console.log(`dyn_cooldown: ${Number(args[0])}`);
    return testDuration(Number(args[0]));
}

function testDuration(arg: number) {
    return (arg * arg) / 3500;
}