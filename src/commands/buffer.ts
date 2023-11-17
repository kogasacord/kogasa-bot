import { Client, Embed, EmbedBuilder, Message } from "discord.js";
import { ExternalDependencies } from "../helpers/types.js";

export const name = "buffer";
export const aliases = ["back"]
export const cooldown = 5;
export const description = "Backtrack a channel, a command better than Small's implementation."
export async function execute(client: Client, msg: Message, args: string[], external_data: ExternalDependencies) {
	const queue_collection = external_data.external_data[2];
	const queue = queue_collection.get(msg.channelId);
	const embed = new EmbedBuilder();
	if (queue) {
		const formatted = queue.get_internal();
		embed.addFields({name: "SNIPED", value: formatted.join("\n")});
	} else {
		embed.addFields({name: "no messages here.", value: "huh"});
	}
	msg.reply({ embeds: [embed] });
}
