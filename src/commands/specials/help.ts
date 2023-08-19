import { Client, Collection, Message, EmbedBuilder } from "discord.js";
import { CommandModule } from "../../helpers/types";

export const name = "help";
export const cooldown = 20;
export const special = true;
export const description = "Check what I can do."
export async function execute(
    client: Client,
    msg: Message,
    args: string[],
    commands: Collection<string, CommandModule>,
    prefix: string,
) {
    const embed = new EmbedBuilder()
        .setTitle("Help! Bad Apple!")
        .setDescription("~~~~~");
    for (const command of commands) {
        embed.addFields({
            name:  `${prefix}${command[0]}`,
            value: `${command[1].description ?? "No description provided."}`,
            inline: true,
        });
    }
    msg.reply({ embeds: [embed] });
}