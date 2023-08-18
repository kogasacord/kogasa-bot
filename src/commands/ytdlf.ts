import { Client, EmbedBuilder, Message } from "discord.js";
import { getFormats } from "../helpers/ytdl/get_formats.js";

export const name = "ytdlf";
export const cooldown = 20;
export const description = "Find formats for a specific YouTube video."
export async function execute(client: Client, msg: Message, args: string[]) {
    const requested_link = args[0];
    if (!requested_link) {
        msg.reply(`You did not give me a link to scan.`);
        return;
    }

    const f = await getFormats(requested_link);

    let isOver = false;
    let indexer = 0;
    let embed = new EmbedBuilder()
        .setTitle("Quality and Format options")
        .setDescription("~~");
    while (!isOver) {
        if (Number.isInteger((indexer + 1) / 25)) {
            msg.channel.send({ embeds: [embed] });
            embed = new EmbedBuilder();
        }
        const format = f.formats[indexer];
        if (f.formats.length <= indexer) {
            msg.channel.send({ embeds: [embed] });
            break;
        }
        embed.addFields({
            name: `${format.format} [ID: ${format.format_id}]`,
            value: `Video: ${format.video_codec} | Audio: ${format.audio_codec} | Container: ${format.container}`
        });
        indexer++;
    }
}