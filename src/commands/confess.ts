import {ExternalDependencies} from "@helpers/types";
import { Channel, ChannelType, Client, EmbedBuilder, Guild, GuildChannel, Message, PermissionsBitField, TextChannel } from "discord.js";
import { ChannelScope } from "@helpers/types";
import Pocketbase, { RecordModel, RecordService } from "pocketbase";
import { createHash } from "node:crypto";

interface PBGuild extends RecordModel {
	confess: string
}
interface PBChannels extends RecordModel {
	confess_channel_id: string,
	confess_counter: number,
}

async function setup(msg: Message, pb: Pocketbase) {
	const channel_hash = hash(msg.channelId, 15);
	const guild_hash = hash(msg.guild!.id, 15);
	const pb_channels = pb.collection("channels");
	const pb_guild = pb.collection("guild");

	// makes a channel, makes a guild (if unavailable), connects those two.
	let confess_channel = await getRecord<PBChannels>(pb_channels, channel_hash);
	if (confess_channel) {
		await pb_channels.delete(confess_channel.id);
	}
	confess_channel = await pb_channels.create<PBChannels>({ 
		id: channel_hash, 
		confess_channel_id: msg.channelId, 
		confess_counter: 0 
	});
	const guild = await getRecord<PBGuild>(pb_guild, guild_hash);
	if (guild) {
		const previous_channel = await getRecord<PBChannels>(pb_channels, guild.confess);
		if (previous_channel) {
			pb_channels.delete(previous_channel.id);
		}
		await pb_guild.update(guild.id, { "confess": [confess_channel.id] });
		msg.reply(`You switched the confess channel to #${(msg.channel as TextChannel).name}`);
	} else {
		await pb_guild.create({ "id": guild_hash, "confess": [confess_channel.id] });
		msg.reply(`You set up the confess channel on #${(msg.channel as TextChannel).name}`);
	}
}

async function listConfessServers(client: Client<true>, msg: Message, pb: Pocketbase) {
	const confess_activated_guilds: { guild: Guild, channel: TextChannel }[] = [];
	const pb_guild_collection = pb.collection("guild");
	const pb_channel_collection = pb.collection("channels");

	for (const guild of client.guilds.cache.values()) {
		if (guild.members.cache.has(msg.author.id)) { // checking mutually joined servers with user.
			const pb_guild = await getRecord<PBGuild>(pb_guild_collection, hash(guild.id, 15));
			if (pb_guild && pb_guild.confess) { // checking if that guild has activated the feature.
				const pb_confess = await getRecord<PBChannels>(pb_channel_collection, pb_guild.confess);
				if (!pb_confess) {
					continue;
				}
				// quite confident it will be a GuildChannel because of the previous check (msg.channel.type === ChannelType.GuildText)
				const confess_channel = await guild.channels.fetch(pb_confess?.confess_channel_id) as TextChannel;
				if (!confess_channel) {
					continue;
				}
				confess_activated_guilds.push({ guild: guild, channel: confess_channel });
			}
		}
	}

	return confess_activated_guilds;

}

function hash(content: string, hash_length: number) {
	return createHash("sha256").update(content).digest("hex").toString().slice(0, hash_length);
}

export const name = "confess";
export const aliases = [];
export const channel: ChannelScope[] = ["DMs", "Guild"];
export const cooldown = 15;
export const description = "Secretly send a message.";
export async function execute(client: Client<true>, msg: Message, args: string[], ext: ExternalDependencies) {
	const index = Number(args.splice(0, 1).join(""));
	const text = args.join(" ");

	if (msg.channel.type === ChannelType.DM) {
		const confess_activated_guilds = await listConfessServers(client, msg, ext.pb);

		if (!isNaN(index) && text.length !== 0) {
			const confess = confess_activated_guilds.at(index);
			if (!confess) {
				msg.reply("No guild associated with the index.");
				return;
			}
			const hash_channel_id = hash(confess.channel.id, 15);
			const channels = ext.pb.collection("channels");
			const channel_record = await getRecord<PBChannels>(channels, hash_channel_id);
			const counter = Number(channel_record!.confess_counter) + 1;
			await channels.update<PBChannels>(hash_channel_id, { confess_counter: counter });

			const embed = new EmbedBuilder();
			embed.setTitle(`Confession #${counter}`);
			embed.setDescription(text.slice(0, 255)); // no idea what the description limit is.

			confess.channel.send({ embeds: [embed] });
			msg.reply(`Sent to #${confess.channel.name} at ${confess.guild.name}`);
		} else {
			if (confess_activated_guilds.length <= 0) {
				msg.reply("You have no servers that are available to confess on.");
				return;
			}

			const embed = new EmbedBuilder();
			embed.setTitle("Choose a server to confess on: ");
			for (let index = 0; index < confess_activated_guilds.length; index++) {
				const guild = confess_activated_guilds[index];
				embed.addFields({name: `#${index} ${guild.guild.name}`, value: `At: ${guild.channel.name}`, inline: true});
			}
			msg.author.send({ content: "Choose with `!!confess [index (the one with the hashtag)] [text]`", embeds: [embed] });
		}
	}

	if (msg.channel.type === ChannelType.GuildText) {
		const has_perms = msg.member?.permissions.has(PermissionsBitField.Flags.ManageChannels);
		if (!has_perms) {
			msg.reply("You need to have the Manage Channels permission before setting up the confess channel.");
			return;
		}
		await setup(msg, ext.pb);
	}
}

async function getRecord<T extends RecordModel>(collection: RecordService<T>, id: string): Promise<T | undefined> {
	try {
		return await collection.getOne(id);
	} catch (error) {
		return undefined;
	}
}
