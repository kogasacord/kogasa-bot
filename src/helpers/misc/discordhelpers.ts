import { Client, ChannelType, Message, Collection } from "discord.js";
import { CommandModule } from "@helpers/types.js";

export async function completePartialMessage(
	client: Client,
	channel_id: string,
	message_id: string
): Promise<Message<true> | null> {
	try {
		// try-catch is a bit..
		const channel =
			client.channels.cache.get(channel_id) ??
			(await client.channels.fetch(channel_id));
		if (channel && channel.type === ChannelType.GuildText) {
			return (
				channel.messages.cache.get(message_id) ??
				(await channel.messages.fetch(message_id))
			);
		}
		return null;
	} catch (err) {
		return null;
	}
}

export function aliasNameToCommand(
	aliases: Map<string, string>,
	commands: Collection<string, CommandModule>,
	alias: string
) {
	const command_name = aliases.get(alias);
	if (command_name) {
		return commands.get(command_name);
	}
	return commands.get(alias);
}
