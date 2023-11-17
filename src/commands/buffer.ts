import { Channel, ChannelType, Client, Embed, EmbedBuilder, GuildChannel, GuildHubType, Message, TextChannel } from "discord.js";
import { ExternalDependencies } from "../helpers/types.js";
import {toSuperScript} from "../helpers/misc/tosuperscript.js";

export const name = "buffer";
export const aliases = ["back"]
export const cooldown = 5;
export const description = "Backtrack a channel, a command better than Small's implementation."
export async function execute(client: Client, msg: Message, args: string[], external_data: ExternalDependencies) {
	const queue_collection = external_data.external_data[2];
	const queue = queue_collection.get(msg.channelId);
	const embed = new EmbedBuilder();
	if (queue) {
		const messages = queue.get_internal();
		if (messages.length < 1) {
			return embed.addFields({name: "no messages here.", value: "huh"});
		}

		let format = "";
		for (const message of messages) {
			const [display_names, message_content, replied_channelId, replied_messageId] = message;

			if (replied_channelId && replied_messageId) {
				const replied_message: Message<true> = await getRepliedMessage(client, replied_channelId, replied_messageId) as any;
				const message_format = `${replied_message.author.displayName}: ${replied_message.content}`;
				format += `┌── ${message_format}\n`;
			}
			format += `${display_names}: ${message_content}\n`;
		}
		embed.addFields({name: "Bang.", value: format});
	} else {
		embed.addFields({name: "no messages here.", value: "huh"});
	}
	msg.reply({ embeds: [embed] });
}

async function getRepliedMessage(client: Client, channel_id: string, message_id: string): Promise<Message<true> | null> {
	const channel = (client.channels.cache.get(channel_id)
		?? await client.channels.fetch(channel_id));
	if (channel && channel.type === ChannelType.GuildText) {
		return channel.messages.cache.get(message_id) ?? await channel.messages.fetch(message_id);	
	}
	return null;
}
