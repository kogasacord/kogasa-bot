import { Client, Message, EmbedBuilder } from "discord.js";
import { ExternalDependencies } from "../../helpers/types.js";
import {formatArray} from "../../helpers/misc/smartjoin.js";

export const name = "help";
export const cooldown = 20;
export const special = true;
export const description = "Check what I can do."
export const noscope = true;
export async function execute(
    client: Client,
    msg: Message,
    args: string[],
    ext: ExternalDependencies,
) {
    const embed = new EmbedBuilder()
        .setTitle("Help! Bad Apple!")
        .setDescription("~~~~~");
    for (const [name, command] of ext.commands) {
        embed.addFields({
            name:  `${ext.prefix}${name}`,
            value: `${command.description ?? "No description provided."}\n` 
						+ (command.aliases 
								? `**\`Aliases\`**: \`${formatArray(command.aliases)}\`` 
								: ""),
            inline: true,
        });
    }
    msg.reply({ embeds: [embed] });
}
