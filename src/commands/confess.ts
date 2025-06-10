import { ExternalDependencies } from "@helpers/types";
import {
	ChannelType,
	Client,
	EmbedBuilder,
	Guild,
	GuildMember,
	Message,
	PermissionsBitField,
	TextChannel,
} from "discord.js";
import { ChannelScope } from "@helpers/types";
import { createHash } from "node:crypto";
import sql from "sql-template-tag";
import { Database } from "better-sqlite3";

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
	confess_banned: string, // boolean.
	user_id: string, // fk
	guild_id: string, // fk
}
interface DBConfessChannel {
	id: string,
	name: string,
	count: number,
	channel_id: string, // not a foreign key.
	guild_id: string, // fk
}
interface DBConfession {
	id: string,
	confession_number: number,
	timestamp: Date,
	confess_channel_id: string, // fk
	guild_user_id: string, // fk
}

type ServerList = {
	guild_name: Pick<DBGuild, "name">
	channel_name: Pick<DBConfessChannel, "name">
	count: Pick<DBConfessChannel, "count">
}

const HASH_LENGTH = 25;

export const name = "confess";
export const aliases = [];
export const channel: ChannelScope[] = ["DMs", "Guild"];
export const cooldown = 1;
export const description = "Secretly send a message.";
export const extended_description =
	"To confess, you must do `??confess` in DMs first and follow the instructions listed there." +
	"\nFor server owners, `??confess ban (confession number)` and `??confess ban @User` to moderate it." +
	"\n`??confess` in a channel to set it up.";
// TODO: the ability to remove the confess feature entirely.
// TODO: if a channel or server has been deleted, 
// 		when someone tries to confess to it, 
// 			on error (trying to send to a non-existent channel): 
// 				it should delete the records associated with the guild/channel
export async function execute(
	client: Client<true>,
	msg: Message,
	args: string[],
	ext: ExternalDependencies
) {
	const db = ext.db;
	const insert_user_stmt = db.prepare<DBUsers>(sql`INSERT OR IGNORE INTO users (id, name) VALUES (@id, @name)`.sql);
	const insert_guild_stmt = db.prepare<DBGuild>(sql`INSERT OR IGNORE INTO guild (id, name) VALUES (@id, @name)`.sql);
	const insert_guild_user_stmt = db.prepare<DBGuildUser>(sql`INSERT OR IGNORE INTO guild_user (id, name, confess_banned, user_id, guild_id) VALUES (@id, @name, @confess_banned, @user_id, @guild_id)`.sql);
	const insert_confess_channel_stmt = db.prepare<DBConfessChannel>(sql`INSERT OR IGNORE INTO confess_channel (id, name, channel_id, guild_id, count) VALUES (@id, @name, @channel_id, @guild_id, @count)`.sql);
	const insert_confession_stmt = db.prepare<DBConfession>(sql`INSERT OR IGNORE INTO confession (id, confession_number, timestamp, confess_channel_id, guild_user_id) VALUES (@id, @confession_number, @timestamp, @confess_channel_id, @guild_user_id)`.sql);

	const get_users = db.prepare(sql`SELECT * FROM users`.sql);
	const get_guilds = db.prepare(sql`SELECT * FROM guild`.sql);
	const get_guild_users = db.prepare(sql`SELECT * FROM guild_user`.sql);
	const get_confess_channels = db.prepare(sql`SELECT * FROM confess_channel`.sql);
	const confessions = db.prepare(sql`SELECT * FROM confession`.sql);

	const get_everything = db.transaction(() => {
		const users = get_users.all() as DBUsers[] | undefined;
		const guilds = get_guilds.all() as DBGuild[] | undefined;
		const guild_users = get_guild_users.all() as DBGuildUser[] | undefined;
		const confess_channels = get_confess_channels.all() as DBConfessChannel[] | undefined;

		return `users: ${JSON.stringify(users)}\n`
			+ `guilds: ${JSON.stringify(guilds)}\n`
			+ `guild users: ${JSON.stringify(guild_users)}\n`
			+ `confess channels: ${JSON.stringify(confess_channels)}`;
	});

	if (args.at(0) === "reset") {
		db.transaction(() => {
			db.prepare(sql`DELETE FROM confession`.sql).run();
			db.prepare(sql`DELETE FROM confess_channel`.sql).run();
			db.prepare(sql`DELETE FROM guild_user`.sql).run();
			db.prepare(sql`DELETE FROM guild`.sql).run();
			db.prepare(sql`DELETE FROM users`.sql).run();
		})();
		msg.reply("Resetted the database.");
		return;
	}
	if (args.at(0) === "get") {
		msg.reply(get_everything());
		return;
	}


	if (msg.channel.type === ChannelType.DM) {
		const user_existing = db.prepare(sql`SELECT 1 FROM users WHERE id = ?`.sql);
		const is_user_existing = user_existing.get(msg.author.id) as boolean | undefined;
		if (is_user_existing === undefined) {
			createUserRecords(db, msg, client);
			await msg.reply("Created user records");
		}

		const servers = listServers(db, msg.author.id);
		if (servers && servers.length > 0) {
			sendConfessServerSelection(msg, servers);
		} else {
			msg.reply("No servers in common!");
		}
		// ??confess [guild_index] [text] - confesses the text.
		// ??confess - lists down the servers they can confess in
		// 		when the user tries to confess in dms,
		// 			when they do not exist in the database,
		// 			check every single guild that kogasa is in,
		// 				check if the user is in those.
	}
	if (msg.channel.type === ChannelType.GuildText) {
		// mod perm check needed here
		const confess_disable: boolean = args.at(0)?.toLowerCase() === "disable" ? true : false;
		if (confess_disable) {
			disable(db, msg as Message<true>);
		} else {
			await setup(db, msg as Message<true>);
		}
		// set confess channel by typing ??confess in, ??confess disable is allowed too.
		// warn people that confess is supposed to be done in dms, delete their message too.
	}
	// msg.reply("Confess is being moved!");
}

//// DM ////
function dm(msg: Message<boolean>) {
	
}
function listServers(db: Database, user_id: string): ServerList[] | undefined {
	const list = db.transaction((user_id: string) => {
		const join = db.prepare(sql`
			SELECT 
				guild.name AS guild_name, 
				confess_channel.name AS channel_name,
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
function confess() {
	
}

//// GUILD ////
function disable(db: Database, msg: Message<true>) {
	const res = db.prepare(sql`DELETE FROM confess_channel WHERE guild_id = ?`.sql).run(msg.guild.id);
	msg.reply("Disabled confess from this server.");
}
// temporary async.
async function setup(db: Database, msg: Message<true>) {
	const insert_guild_stmt = db.prepare<DBGuild>(sql`INSERT OR IGNORE INTO guild (id, name) VALUES (@id, @name)`.sql);
	const insert_confess_channel_stmt = db.prepare<DBConfessChannel>(sql`INSERT OR IGNORE INTO confess_channel (id, name, channel_id, guild_id, count) VALUES (@id, @name, @channel_id, @guild_id, @count)`.sql);

	const guild_existing = db.prepare(sql`SELECT 1 FROM guild WHERE id = ?`.sql);
	const is_guild_existing = guild_existing.get(msg.guild.id) as DBGuild | undefined;
	if (is_guild_existing === undefined) {
		insert_guild_stmt.run({ id: msg.guild!.id, name: msg.guild!.name });
		// temp: remove message.
		await msg.reply("Creating guild that didn't exist in the database.");
	}

	const confess_channel = db.prepare(sql`SELECT * FROM confess_channel WHERE guild_id = ? LIMIT 1`.sql)
		.get(msg.guild!.id) as DBConfessChannel | undefined;

	if (confess_channel) {
		if (confess_channel.channel_id !== msg.channelId) {
			db.prepare(sql`UPDATE confess_channel SET name = @name, channel_id = @to WHERE channel_id = @from`.sql)
				.run({ name: msg.channel.name, to: msg.channelId, from: confess_channel.channel_id });
			// temp: remove await.
			await msg.reply(`Switched confess to ${msg.channel.name} channel.`);
		} else {
			await msg.reply("Set to the same channel!");
		}
	} else {
		db.transaction((msg: Message<true>) => {
			insert_confess_channel_stmt.run({
				id: msg.channelId,
				name: msg.channel.name,
				guild_id: msg.guild!.id,
				channel_id: msg.channel.id,
				count: 0,
			});
		})(msg as Message<true>);

		await msg.reply("Set confess channel.");
	}
}


//// DB ////

async function createUserRecords(db: Database, msg: Message, client: Client<true>) {
	const insert_user_stmt = db.prepare<DBUsers>(sql`INSERT OR IGNORE INTO users (id, name) VALUES (@id, @name)`.sql);
	const insert_guild_user_stmt = db.prepare<DBGuildUser>(sql`INSERT OR IGNORE INTO guild_user (id, name, confess_banned, user_id, guild_id) VALUES (@id, @name, @confess_banned, @user_id, @guild_id)`.sql);

	const get_confess_guild_ids = db.prepare(sql`SELECT channel_id, guild_id FROM confess_channel`.sql);
	const delete_channel_ids = db.prepare(sql`DELETE FROM confess_channel WHERE id = ?`.sql);

	//  lists down the servers they can confess in
	// 		when the user tries to confess in dms,
	// 			if the user does not exist in the database,
	// 				check every single guild that kogasa stored in sqlite,
	// 				grab the ids, query the guilds (client.cache)
	// 				check if the user is in those. (client.fetch)
	
	insert_user_stmt.run({ id: msg.author.id, name: msg.author.globalName ?? msg.author.displayName });

	const db_guild_id_with_confess = get_confess_guild_ids.all() as { channel_id: string, guild_id: string }[];
	const discord_guilds = client.guilds.cache;
	for (const db_res of db_guild_id_with_confess) {
		for (const [_, guild] of discord_guilds) {
			if (db_res.guild_id === guild.id) {
				const discord_channels = guild.channels.cache.get(db_res.channel_id) as TextChannel 
					?? await guild.channels.fetch(db_res.channel_id) as TextChannel | null;
				if (discord_channels === null) {
					// TODO: move this somewhere to be used when someone deletes
					// 			a channel without disabling it.
					// deleting the channel if it couldn't be fetched.
					delete_channel_ids.run(db_res.channel_id);
				}
				insert_guild_user_stmt.run({ 
					id: hash(msg.author.id + guild.id, HASH_LENGTH),
					name: msg.author.globalName ?? msg.author.displayName,
					confess_banned: "false",
					guild_id: guild.id,
					user_id: msg.author.id,
				});
			}
		}
	}

}


function hash(content: string, hash_length: number) {
	return createHash("sha256")
		.update(content)
		.digest("hex")
		.toString()
		.slice(0, hash_length);
}

