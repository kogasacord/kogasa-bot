import { Client, EmbedBuilder, Message } from "discord.js";
import { ExternalDependencies } from "../helpers/types.js";
import { getMessage } from "../helpers/misc/fetch.js";

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
			if (message.replied) {
				const replied_message_format = await formatMessage(client, message.replied.channel_id, message.replied.message_id, message.replied.display_name, message.replied.content);
				format += `┌── ${replied_message_format}\n`;
			}
			const message_format = await formatMessage(client, message.channel_id, message.message_id, message.display_name, message.content) 
			format += `${message_format}\n`;
		}
		embed.addFields({name: "Bang.", value: format});
	} else {
		embed.addFields({name: "no messages here.", value: "huh"});
	}
	msg.reply({ embeds: [embed] });
}

async function formatMessage(
	client: Client,
	channel_id: string,
	message_id: string,
	display_name: string,
	content: string,
) {
	const updated_message = await getMessage(client, channel_id, message_id);
	if (updated_message) {
		if (updated_message.content !== content) {
			return `\`${updated_message.author.displayName} [EDITED]:\` ~~${content}~~ ${updated_message.content}`
		}
		return `\`${updated_message.author.displayName}:\` ${updated_message.content}`;
	} else {
		return `\`${display_name}\` [DELETED]: ${content}`;
	}
}
