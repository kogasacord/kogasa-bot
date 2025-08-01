import helpers from "@helpers/helpers.js";
import {
	Client,
	GuildMember,
	Message,
	User,
} from "discord.js";
import { ChannelScope } from "@helpers/types";

export const name = "quote";
export const aliases = ["q"];
export const cooldown = 25;
export const channel: ChannelScope[] = ["Guild", "Thread"];
export const description =
	"Reply to someone and capture a.. suspicious message.";
export const extended_description =
	"This makes an image to capture the message you replied to.";
export async function execute(
	client: Client,
	msg: Message<true>,
	_args: string[]
) {
	if (!(msg.reference && msg.reference.messageId) && msg.content.length <= 0) {
		msg.reply("You need to reply to a message in order to quote it.");
		return;
	}
	const replied =
		msg.channel.messages.cache.get(msg.reference!.messageId!) ??
		(await msg.channel.messages.fetch(msg.reference!.messageId!));

	const parsed_content = await parseQuotes(client, replied.content);

	const guild =
		client.guilds.cache.get(replied.guildId) ??
		(await client.guilds.fetch(replied.guildId));
	const guild_member =
		guild.members.cache.get(replied.author.id) ??
		(await guild.members.fetch(replied.author.id));

	const avatar_url = getAvatarURL(replied.author, guild_member);

	try {
		const recieved_quote = await helpers.quoteDefault(
			parsed_content,
			"- " + replied.author.username,
			avatar_url
		);
		msg.reply({
			files: [{ attachment: recieved_quote }],
		});
	} catch (err) {
		msg.reply("Something went wrong.");
		console.log(err);
	}
}

function getAvatarURL(user: User, guild_member: GuildMember) {
	return (
		guild_member.avatarURL({ size: 1024, extension: "png" }) ??
		user.avatarURL({ size: 1024, extension: "png" }) ??
		user.displayAvatarURL({ size: 1024, extension: "png" })
	);
}

/**
 * parses text to remove/replace mentions or emotes
 */
async function parseQuotes(client: Client, str: string) {
	let string = str.slice();

	const uid_regex = /<@(\d+)>/g;
	for (const [entire_mention, uid] of string.matchAll(uid_regex)) {
		try {
			const user =
				client.users.cache.get(uid) ?? (await client.users.fetch(uid));
			const username = user.displayName ?? user.username;
			string = string.replace(entire_mention, username);
		} catch (err) {
			string = string.replace(entire_mention, "");
		}
	}

	string = string.replace(/<a?:[^\s]+:\d+>/g, "");

	return string;
}
