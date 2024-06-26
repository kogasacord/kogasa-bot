import {ExternalDependencies} from "@helpers/types";
import { ChannelType, Client, Message } from "discord.js";
import { ChannelScope } from "@helpers/types";
import Pocketbase, { RecordModel } from "pocketbase";
import { createHash } from "node:crypto";

interface PBGuild extends RecordModel {
	confess: string
}
interface PBChannels extends RecordModel {
	confess: boolean
}

// i dont know what's happening to this code anymore.
async function setup(msg: Message, pb: Pocketbase) {
	const msg_id = createHash("sha256")
		.update(msg.channel.id)
		.digest("hex")
		.toString()
		.slice(0, 15);
	const guild_id = createHash("sha256")
		.update(msg.guild!.id)
		.digest("hex")
		.toString()
		.slice(0, 15);
	const pb_channels = pb.collection("channels");
	const pb_guild = pb.collection("guild");

	let confess_channel;
	try {
		confess_channel = await pb_channels.getOne(msg_id);
	} catch (error) {
		confess_channel = await pb_channels.create<PBChannels>({ id: msg_id, confess: true });
	}
	try { // wow this sucks.
		// so im relying on getOne to throw an error if there's no record found, this is the result.
		const guild = await pb_guild.getOne<PBGuild>(guild_id);
		await pb_channels.delete(guild.confess);
		await pb_guild.update(guild.id, { confess: confess_channel.id });
	} catch (error) { // i hate trycatch.
		await pb_guild.create({ id: msg.guild!.id, confess: confess_channel.id });
	}
}

export const name = "confess";
export const aliases = [];
export const channel: ChannelScope[] = ["DMs", "Guild"];
export const cooldown = 25;
export const description = "Secretly send a message. [in progress]";
export async function execute(client: Client, msg: Message, args: string[], ext: ExternalDependencies) {
	const text = args.join(" ");
	if (msg.channel.type === ChannelType.DM) {
		// the main.
	}
	if (msg.channel.type === ChannelType.GuildText) {
		setup(msg, ext.pb);
	}
	// TODO: [confess set up]
	// 					=> (get confess channel ID)
	// 					=> (set on server ID)
	// 			 [confess feat]
	// 			 		=> (get server & confess channel ID)
	// 			 		=> (send confession to channel ID)

	// msg.reply(`Confess: ${text}`); 
}
