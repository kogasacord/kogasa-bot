import {ExternalDependencies} from "@helpers/types";
import { ChannelType, Client, Message } from "discord.js";
import { ChannelScope } from "@helpers/types";
import Pocketbase, { RecordModel, RecordService } from "pocketbase";
import { createHash } from "node:crypto";

interface PBGuild extends RecordModel {
	confess: string
}
interface PBChannels extends RecordModel {
	confess: boolean
}

// i dont know what's happening to this code anymore.
async function setup(msg: Message, pb: Pocketbase) {
	const channel_hash = createHash("sha256")
		.update(msg.channel.id)
		.digest("hex")
		.toString()
		.slice(0, 15);
	const guild_hash = createHash("sha256")
		.update(msg.guild!.id)
		.digest("hex")
		.toString()
		.slice(0, 15);
	const pb_channels = pb.collection("channels");
	const pb_guild = pb.collection("guild");

	// makes a channel, makes a guild (if unavailable), connects those two.
	let confess_channel = await getRecord<PBChannels>(pb_channels, channel_hash);
	if (confess_channel) {
		await pb_channels.delete(confess_channel.id);
	}
	confess_channel = await pb_channels.create<PBChannels>({ id: channel_hash, confess: true });
	const guild = await getRecord<PBGuild>(pb_guild, guild_hash);
	if (guild) {
		const previous_channel = await getRecord<PBChannels>(pb_channels, guild.confess);
		if (previous_channel) {
			pb_channels.delete(previous_channel.id);
		}
		await pb_guild.update(guild.id, { "confess": [confess_channel.id] });
	} else {
		await pb_guild.create({ "id": guild_hash, "confess": [confess_channel.id] });
	}
}

async function getRecord<T extends RecordModel>(collection: RecordService<T>, id: string): Promise<T | undefined> {
	try {
		return await collection.getOne(id);
	} catch (error) {
		return undefined;
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
