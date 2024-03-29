import helpers, { ExternalDependencies } from "@helpers/helpers.js";
import { Client, Message, EmbedBuilder } from "discord.js";

export const name = "help";
export const cooldown = 20;
export const special = true;
export const channel = "Guild";
export const description = "Check what I can do.";
export const noscope = true;
export async function execute(
	client: Client,
	msg: Message,
	args: string[],
	ext: ExternalDependencies
) {
	const embed = new EmbedBuilder()
		.setTitle("Help! Bad Apple!")
		.setDescription("~~~~~");
	for (const [name, command] of ext.commands) {
		const description = (command.description ?? "No description provided.");
		embed.addFields({
			name: `${ext.prefix}${name} [${command.channel}]`,
			value:
				`${description}\n` +
				(command.aliases
					? `**\`Aliases\`**: \`${helpers.formatArray(command.aliases)}\``
					: ""),
			inline: true,
		});
	}
	msg.reply({ embeds: [embed] });
}
