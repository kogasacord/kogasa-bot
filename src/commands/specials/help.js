import { EmbedBuilder } from "discord.js";
export const name = "help";
export const cooldown = 20;
export const special = true;
export const description = "Check what I can do.";
export const noscope = true;
export async function execute(client, msg, args, ext) {
    const embed = new EmbedBuilder()
        .setTitle("Help! Bad Apple!")
        .setDescription("~~~~~");
    for (const command of ext.commands) {
        embed.addFields({
            name: `${ext.prefix}${command[0]}`,
            value: `${command[1].description ?? "No description provided."}`,
            inline: true,
        });
    }
    msg.reply({ embeds: [embed] });
}
