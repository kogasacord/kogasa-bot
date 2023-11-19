import { Client, EmbedBuilder, Message } from "discord.js";
import { ChatBufferMessage, ExternalDependencies } from "../helpers/types.js";
import { getMessage } from "../helpers/misc/fetch.js";

export const name = "buffer";
export const aliases = ["back", "backtrack", "b"]
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
			format += `${formatMessage(message)}\n`;
		}
		embed.addFields({name: "Bang.", value: format});
	} else {
		embed.addFields({name: "no messages here.", value: "huh"});
	}
	msg.reply({ embeds: [embed] });
}

function formatMessage(message: ChatBufferMessage) {
	let format = "";
	if (message.replied)
		format += `╔═ \`${message.replied.display_name}\` ${message.replied.is_deleted ? "[DELETED]" : ""}: ${message.replied.content}\n`;
	format += `\`${message.display_name}\`${message.is_deleted ? " [DELETED]:" : ":"} ${message.edits.length >= 1 ? "\n" : ""}${message.edits.map((v, i) => `||${v}||\n`).join("")} ${message.content}`;

	return format;
}
