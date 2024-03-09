import helpers, { ExternalDependencies } from "@helpers/helpers.js";
import { Client, Message, EmbedBuilder, GuildChannel, ThreadChannel, DMChannel } from "discord.js";
import { ChannelScope } from "@helpers/types";

export const name = "help";
export const cooldown = 20;
export const special = true;
export const channel: ChannelScope[] = ["Guild", "DMs", "Thread"];
export const description = "Check what I can do.";
export const noscope = true;
export async function execute(
	client: Client,
	msg: Message,
	args: string[],
	ext: ExternalDependencies
) {
	const channel_types: [typeof GuildChannel | typeof ThreadChannel | typeof DMChannel, ChannelScope][] = [[DMChannel, "DMs"], [GuildChannel, "Guild"], [ThreadChannel, "Thread"]];
	const embed = new EmbedBuilder()
		.setTitle("Help! Bad Apple!")
		.setDescription("~~~~~");
	for (const [name, command] of ext.commands) {
		if (channel_types.some(([t, scope]) => command.channel.includes(scope) && msg.channel instanceof t)) {
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

	}
	msg.reply({ embeds: [embed] });
}
