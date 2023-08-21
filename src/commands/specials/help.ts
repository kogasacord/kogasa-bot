import { Client, Message, EmbedBuilder } from "discord.js";
import { ExternalDependencies } from "../../helpers/types.js";

export const name = "help";
export const cooldown = 20;
export const special = true;
export const description = "Check what I can do."
export async function execute(
    client: Client,
    msg: Message,
    args: string[],
    ext: ExternalDependencies,
) {
    const embed = new EmbedBuilder()
        .setTitle("Help! Bad Apple!")
        .setDescription("~~~~~");
    for (const command of ext.commands) {
        embed.addFields({
            name:  `${ext.prefix}${command[0]}`,
            value: `${command[1].description ?? "No description provided."}`,
            inline: true,
        });
    }
    msg.reply({ embeds: [embed] });
}