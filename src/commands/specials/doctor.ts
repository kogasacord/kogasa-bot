import { Client, Collection, Message } from "discord.js";
import { CommandModule } from "../../helpers/types.js";
import { getInfo } from "../../helpers/ytdl/info.js";
import { quoteDefault } from "../../helpers/quote/default.js";

export const name = "doctor";
export const cooldown = 20;
export const special = true;
export const description = "Send me to Eirin and let them check my health. [Partially Implemented (5%)]"
export async function execute(
    client: Client,
    msg: Message,
    args: string[],
    commands: Collection<string, CommandModule>,
) {
    const doctor_results = {
        ytdl_server_on:   false,
        canvas_server_on: false,
    }
    try {
        await getInfo("https://www.youtube.com/watch?v=vQHVGXdcqEQ");
        doctor_results.ytdl_server_on = true;
    } catch (err) {
        doctor_results.ytdl_server_on = false;
    }

    try {
        await quoteDefault("test", "Alice", msg.author.avatarURL() ?? "https://cdn.discordapp.com/attachments/967277090191855709/1142501550875488388/file.jpg")
        doctor_results.canvas_server_on = true;
    } catch (err) {
        doctor_results.canvas_server_on = false;
    }

    msg.reply(
        `## Eirin's Diagnosis:\n`
            + `\`YTDL Server\`: ${doctor_results.ytdl_server_on ? "ON" : "OFF"}\n`
            + `\`Canvas\`: ${doctor_results.canvas_server_on ? "ON" : "OFF"}`
    );
}
// check the different HTTPS and commands