import { ExternalDependencies } from "@helpers/types";
import {
	ChannelType,
	Client,
	EmbedBuilder,
	GuildMember,
	Message,
	TextChannel,
} from "discord.js";
import { ChannelScope } from "@helpers/types";
import sql from "sql-template-tag";
import { Database } from "better-sqlite3";
import {hash, HASH_LENGTH} from "@helpers/db/hash";

// cache data on first run?

interface DBUsers {
	id: string,
	name: string,
}
interface DBGuild {
	id: string,
	name: string,
}
interface DBGuildUser {
	id: string,
	name: string,
	confess_banned: number, // boolean.
	user_id: string, // fk
	guild_id: string, // fk
}
interface DBConfessChannel {
	id?: number,
	name: string,
	count: number,
	channel_id: string, // not a foreign key.
	guild_id: string, // fk
}
interface DBConfession {
	id?: string,
	confession_number: number,
	timestamp: string,
	confess_channel_id: number, // fk
	guild_user_id: string, // fk
}

type FromChannel = Pick<DBConfessChannel, "channel_id" | "name" | "count">
type FromGuild = Pick<DBGuild, "id" | "name">
type ServerList = {
	channel_id: FromChannel["channel_id"]
	channel_name: FromChannel["name"]
	count: FromChannel["count"]
	guild_id: FromGuild["id"]
	guild_name: FromGuild["name"]
}

export const name = "confess";
export const aliases = [];
export const channel: ChannelScope[] = ["DMs", "Guild"];
export const cooldown = 1;
export const description = "Secretly send a message.";
export const extended_description =
	"To confess, you must do `<prefix>confess` in DMs first and follow the instructions listed there." +
	"\nFor server owners, `<prefix>confess mute-toggle (confession number)` and `<prefix>confess mute-toggle @User` to moderate it." +
	"\n`<prefix>confess` in a channel to set it up.";
export async function execute(
	_client: Client<true>,
	msg: Message,
	args: string[],
	ext: ExternalDependencies
) {
	const db = ext.db;

	if (msg.channel.type === ChannelType.DM) {
		await createGuildUserRecords(db, msg as Message<false>);
		const servers = listServers(db, msg.author.id);

		const index = args.at(0);
		const text = args.slice(1).join(" ");
		const guild_index = Number(index);
		if (servers === undefined || (servers && servers.length <= 0)) {
			msg.reply("No servers in common!");
			return;
		}

		if (isNaN(guild_index) || text.length <= 0) {
			// ??confess
			sendConfessServerSelection(msg, servers);
		} else {
			// ??confess [guild_index] [text] - confesses the text.
			confess(db, msg as Message<false>, servers, guild_index, text);
		}
	}
	if (msg.channel.type === ChannelType.GuildText) {
		const confess_disable = args.at(0)?.toLowerCase();
		const mentioned = msg.mentions.members?.at(0);

		if (msg.member!.permissions.has("ManageGuild")) {
			if (confess_disable === "disable") {
				disable(db, msg as Message<true>);
			} else if (confess_disable === "mute-toggle") {
				const index = args.at(1);
				const confession_index = Number(index);

				if (mentioned !== undefined) {
					banUserFromConfess(db, msg as Message<true>, mentioned);
				} else {
					if (isNaN(confession_index)) {
						msg.reply("Enter a valid confession!");
					} else {
						banIndexFromConfess(db, msg as Message<true>, confession_index);
					}
				}
			} else {
				setup(db, msg as Message<true>);
			}
		} else {
			msg.reply("Confess in dms instead!");
			msg.delete().catch(() => {});
		}
	}
}

function banUserFromConfess(db: Database, msg: Message<true>, user: GuildMember) {
	const guild_id = msg.guild.id;
	const hash_target_user = hash(user.id + guild_id, HASH_LENGTH);

	const toggle_ban_user = db.prepare(sql`UPDATE guild_user SET confess_banned = NOT confess_banned WHERE id = ?`.sql);
	const is_confess_banned_stmt = db.prepare(sql`
		SELECT confess_banned
		FROM guild_user
		WHERE id = ?
	`.sql);
	toggle_ban_user.run(hash_target_user);
	const is_confess_banned = is_confess_banned_stmt.get(hash_target_user) as Pick<DBGuildUser, "confess_banned"> | undefined;

	msg.reply(`Confessor has been ${is_confess_banned?.confess_banned ? "muted" : "unmuted"}.`);
}

function banIndexFromConfess(db: Database, msg: Message<true>, confession_index: number) {
	const guild_id = msg.guild.id;

	const get_confess_channel_stmt = db.prepare(sql`
		SELECT id, channel_id 
		FROM confess_channel 
		WHERE guild_id = ?
		LIMIT 1
	`.sql);
	const get_confession_stmt = db.prepare<{ confess_channel_id: number, confession_number: number }>(sql`
		SELECT guild_user_id
		FROM confession 
		WHERE confess_channel_id = @confess_channel_id 
			AND confession_number = @confession_number
		LIMIT 1
	`.sql);
	const update_user_stmt = db.prepare(sql`
		UPDATE guild_user 
		SET confess_banned = NOT confess_banned 
		WHERE id = ?
	`.sql);
	const is_confess_banned_stmt = db.prepare(sql`
		SELECT confess_banned
		FROM guild_user
		WHERE id = ?
	`.sql);

	const confess_channel = get_confess_channel_stmt.get(guild_id) as Pick<DBConfessChannel, "id" | "channel_id"> | undefined;
	if (confess_channel) {
		const user = get_confession_stmt.get({
			confession_number: confession_index,
			confess_channel_id: confess_channel.id!,
		}) as Pick<DBConfession, "guild_user_id"> | undefined;
		if (user !== undefined) {
			if (user.guild_user_id === undefined) {
				throw Error("Database user id is null somehow?");
			}
			update_user_stmt.run(user.guild_user_id);
			const is_confess_banned = is_confess_banned_stmt.get(user.guild_user_id) as Pick<DBGuildUser, "confess_banned"> | undefined;
			msg.reply(`Confessor has been ${is_confess_banned?.confess_banned ? "muted" : "unmuted"}.`);
		} else {
			msg.reply("Invalid confession number.");
		}
	} else {
		msg.reply("Invalid confession number.");
	}
}

//// DM ////
function listServers(db: Database, user_id: string): ServerList[] | undefined {
	const list = db.transaction((user_id: string) => {
		const join = db.prepare(sql`
			SELECT 
				guild.id AS guild_id,
				guild.name AS guild_name, 
				confess_channel.name AS channel_name,
				confess_channel.channel_id,
				confess_channel.count
			FROM guild_user
			JOIN guild ON guild_user.guild_id = guild.id
			JOIN confess_channel ON confess_channel.guild_id = guild.id
			WHERE guild_user.user_id = ?;
		`.sql);
		return join.all(user_id) as ServerList[];
	});
	return list(user_id);
}
async function confess(
	db: Database,
	msg: Message<false>, 
	server_list: ServerList[], 
	index: number, 
	text: string
) {
	const client = msg.client;

	const is_confess_banned_stmt = db.prepare(sql`
		SELECT confess_banned
		FROM guild_user
		WHERE id = ?
	`.sql);

	const delete_channel = db.prepare(sql`DELETE FROM confess_channel WHERE id = ?`.sql);
	const get_confess_channel = db.prepare(sql`
		SELECT id, count 
		FROM confess_channel 
		WHERE channel_id = ?
		LIMIT 1
	`.sql);
	const insert_confession_stmt = db.prepare<DBConfession>(sql`
		INSERT INTO confession (confession_number, timestamp, confess_channel_id, guild_user_id)
		VALUES (@confession_number, @timestamp, @confess_channel_id, @guild_user_id)
	`.sql);

	const server = server_list.at(index);
	if (server !== undefined) {
		const guild_user_id = hash(msg.author.id + server.guild_id, HASH_LENGTH);
		const increment = db.prepare(sql`
			UPDATE confess_channel
			SET count = count + 1
			WHERE channel_id = ?
		`.sql);
		const confess_channel = get_confess_channel.get(server.channel_id) as Pick<DBConfessChannel, "count" | "id"> | undefined;
		const is_confess_banned = is_confess_banned_stmt.get(guild_user_id) as Pick<DBGuildUser, "confess_banned"> | undefined;
		if (is_confess_banned?.confess_banned) {
			msg.reply("You are currently banned!");
			return;
		}

		const discord_channel = client.channels.cache.get(server.channel_id) 
			?? await client.channels.fetch(server.channel_id);
		if (discord_channel instanceof TextChannel) {
			increment.run(server.channel_id);
			insert_confession_stmt.run({
				timestamp: dateToString(new Date(Date.now())),
				confession_number: confess_channel?.count ?? 1,
				guild_user_id: guild_user_id,
				confess_channel_id: confess_channel!.id!,
			});
			const embed = new EmbedBuilder();
				embed.setTitle(`Confession #${confess_channel?.count ?? "unknown"}`);
				embed.setDescription(text.length > 500 ? `${text.slice(0, 500)} ...` : text);
				embed.setFooter({ text: "DM me `??confess` to send a confession." });
			discord_channel.send({ embeds: [embed] })
				.then(() => {
					const writing_hand = "\u270D";
					msg.react(writing_hand).catch(() => {});
				});
		} else {
			// deleting the channel if it couldn't be fetched.
			delete_channel.run(confess_channel!.id!);
			msg.reply("That channel has been deleted.");
		}
	} else {
		msg.reply("You're not in that server!");
	}
}

//// GUILD ////
function disable(db: Database, msg: Message<true>) {
	db.prepare(sql`DELETE FROM confess_channel WHERE guild_id = ?`.sql).run(msg.guild.id);
	msg.reply("Disabled confess from this server.");
}
function setup(db: Database, msg: Message<true>) {
	const insert_guild_stmt = db.prepare<DBGuild>(sql`
		INSERT OR IGNORE INTO guild (id, name) 
		VALUES (@id, @name)
	`.sql);
	const insert_confess_channel_stmt = db.prepare<DBConfessChannel>(sql`
		INSERT OR IGNORE INTO confess_channel (name, channel_id, guild_id, count) 
		VALUES (@name, @channel_id, @guild_id, @count)
	`.sql);
	const guild_existing = db.prepare(sql`SELECT 1 FROM guild WHERE id = ?`.sql);

	const is_guild_existing = guild_existing.get(msg.guild.id) as DBGuild | undefined;
	if (is_guild_existing === undefined) {
		insert_guild_stmt.run({ id: msg.guild!.id, name: msg.guild!.name });
	}

	const confess_channel = db.prepare(sql`
		SELECT *
		FROM confess_channel 
		WHERE guild_id = ? 
		LIMIT 1
	`.sql)
		.get(msg.guild!.id) as DBConfessChannel | undefined;
	if (confess_channel) {
		if (confess_channel.channel_id !== msg.channelId) {
			db.prepare(sql`
				UPDATE confess_channel 
				SET name = @name, channel_id = @to 
				WHERE channel_id = @from
			`.sql)
				.run({ 
					name: msg.channel.name, 
					to: msg.channelId, 
					from: confess_channel.channel_id 
				});
			// delete all confessions related to channel_id in database.
			msg.reply(`Switched confess to ${msg.channel.name} channel.`);
		} else {
			msg.reply("Set to the same channel!");
		}
	} else {
		db.transaction((msg: Message<true>) => {
			insert_confess_channel_stmt.run({
				name: msg.channel.name,
				guild_id: msg.guild!.id,
				channel_id: msg.channel.id,
				count: 0,
			});
		})(msg as Message<true>);

		msg.reply("Set confess channel.");
	}
}


//// HELPERS ////
function sendConfessServerSelection(msg: Message, confess_activated_guilds: ServerList[]) {
	const embed = new EmbedBuilder();
	embed.setTitle("Servers:");
	let index = 0;
	for (const server of confess_activated_guilds) {
		embed.addFields({
			name: `#${index} ${server.guild_name}`,
			value: `At: ${server.channel_name}`,
			inline: true,
		});
		index++;
	}
	msg.author.send({
		content:
			"Choose with `??confess [index] [text]`, e.g: `??confess 0 Example text.`",
		embeds: [embed],
	});
}

async function createGuildUserRecords(db: Database, msg: Message<false>) {
	const insert_user_stmt = db.prepare<DBUsers>(sql`
		INSERT OR IGNORE INTO users (id, name)
		VALUES (@id, @name)
	`.sql);
	const insert_guild_user_stmt = db.prepare<DBGuildUser>(sql`
		INSERT OR IGNORE INTO guild_user (id, name, confess_banned, user_id, guild_id) 
		VALUES (@id, @name, @confess_banned, @user_id, @guild_id)
	`.sql);
	const get_confess_guild_ids = db.prepare(sql`
		SELECT channel_id, guild_id 
		FROM confess_channel
	`.sql);
	
	insert_user_stmt.run({ 
		id: msg.author.id, 
		name: msg.author.globalName ?? msg.author.displayName 
	});
	
	const guilds_joined = new Set<string>();
	for (const guild of msg.client.guilds.cache.values()) {
			try {
				if (guild.members.cache.get(msg.author.id)
					?? await guild.members.fetch(msg.author.id)) {
					guilds_joined.add(guild.id);
				};
			} catch {
				// not in this guild
			}
	}

	// probably more bugs here from guilds disappearing.
	const insert_guild_users = db.transaction((msg: Message<false>) => {
		const db_guild_ids_with_confess = get_confess_guild_ids.all() as { channel_id: string, guild_id: string }[];
		for (const db_res of db_guild_ids_with_confess) {
			if (!guilds_joined.has(db_res.guild_id)) {
				continue;
			}
			insert_guild_user_stmt.run({ 
				id: hash(msg.author.id + db_res.guild_id, HASH_LENGTH),
				name: msg.author.globalName ?? msg.author.displayName,
				confess_banned: 0,
				guild_id: db_res.guild_id,
				user_id: msg.author.id,
			});
		}
	});

	insert_guild_users(msg as Message<false>);
}

function dateToString(date: Date) {
	const isoString = date.toISOString();
	const formattedDate = isoString.split("T")[0];
	return formattedDate;
}
