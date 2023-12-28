import helpers from "@helpers/helpers.js";
import { ChannelType, Client, Message } from "discord.js";

export const name = "quote";
export const aliases = ["q"];
export const cooldown = 10;
export const description =
	"Reply to someone and capture a.. suspicious message.";
export async function execute(client: Client, msg: Message, args: string[]) {
	if (msg.channel.type !== ChannelType.GuildText) return;
	const show_boundaries = args[0] === "boundary";

	const replied =
		msg.channel.messages.cache.get(msg.reference!.messageId!) ??
		(await msg.channel.messages.fetch(msg.reference!.messageId!));

	const parsed_content = await parseQuotes(client, replied.content);

	const guild = client.guilds.cache.get(replied.guildId)
		?? await client.guilds.fetch(replied.guildId);
	const guild_member = guild.members.cache.get(replied.author.id)
		?? await guild.members.fetch(replied.author.id);

	const avatar_url = guild_member.avatarURL({size: 1024, extension: "png"}) 
		?? replied.author.avatarURL({size: 1024, extension: "png"})
		?? replied.author.displayAvatarURL({size: 1024, extension: "png"});
	
	const first_attachment = replied.attachments.at(0);
	const attachment_info = first_attachment?.url
		? {
			url: first_attachment!.url ?? 0,
			height: first_attachment!.height ?? 0,
			width: first_attachment!.width ?? 0,
		} : undefined;

	try {
		const recieved_quote = await quote(
			parsed_content,
			replied.author.displayName,
			avatar_url,
			show_boundaries,
			first_attachment?.contentType,
			attachment_info
		);
		msg.reply({
			files: [{ attachment: recieved_quote }],
		});
	} catch (err) {
		msg.reply("Something went wrong.");
		console.log(err);
	}
}

export async function checker(msg: Message): Promise<boolean> {
	if (!(msg.reference && msg.reference.messageId)) {
		msg.reply("You need to reply to a message in-order to quote it.");
		return false;
	}
	return true;
}

async function quote(
	text: string,
	author: string,
	avatar_url: string,
	show_boundaries: boolean,
	mimetype: string | null | undefined,
	attachment?: {
		url: string;
		height: number;
		width: number;
	}
) {
	if (attachment) {
		if (mimetype?.includes("image/")) {
			return helpers.quoteAttachment(
				text,
				author,
				avatar_url,
				attachment.url,
				attachment.height,
				attachment.width,
				mimetype,
				show_boundaries
			);
		}
	}
	return helpers.quoteDefault(text, author, avatar_url, show_boundaries);
}

async function parseQuotes(client: Client, str: string) {
	const parsed_mentions = await extractObjects(
		str,
		/(?<Id>\d+)/g, // TEST LATER.
		/<@\d+>/g,
		async (extracted) => {
			const user =
				client.users.cache.get(extracted) ??
				(await client.users.fetch(extracted));
			return user.displayName ? user.displayName : user.username;
		}
	);

	const parsed_emotes = parsed_mentions.replace(/<a?:[^\s]+:\d+>/g, "");

	return parsed_emotes;
}

/*
 * Extracts discord's emotes and mentions from the message content.
 */
async function extractObjects(
	str: string,
	extract: RegExp,
	replace: RegExp,
	replacer: (_extracted: string) => Promise<string>
) {
	let string = str.slice();
	const extracted = str.match(extract);
	for (const extract of extracted ?? []) {
		string = string.replace(replace, await replacer(extract));
	}
	return string;
}
