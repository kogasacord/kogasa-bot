import sagiri from "sagiri";
import mimetype from "mime-types";
import { Client, Message } from "discord.js";

import config from "@root/config.json" assert { type: "json" };
import { checkIfLink } from "@helpers/misc/link.js";

const sauce = sagiri(config.saucenao_token, { results: 2 });

export const name = "sauce";
export const cooldown = 60;
export const description =
	"Find the sauce. Reply or send a link/attachment to me.";
export async function execute(client: Client, msg: Message, args: string[]) {
	let response = "";

	const link = args.at(0);
	if (link) {
		response = await useLink(link);
	}

	if (msg.reference?.messageId !== undefined) {
		const replied = await msg.channel.messages.fetch(msg.reference.messageId);
		response = await useAttachments(replied);
	}
	msg.reply(response);
}

/**
 * if the user's request looks like: `??sauce` [replying to someone's image attachment];
 *
 * modifies the response string
 */
async function useAttachments(replied: Message) {
	let response = "## Sources found?:\n\n";

	const first_attachment = replied.attachments.at(0)!;
	const mime_lookup = first_attachment.contentType 
		?? mimetype.lookup(first_attachment.name);

	if (mime_lookup) {
		const match = mime_lookup.match(/image\/.+/);
		if (!match?.[0]) {
			response = "You given me a non-image.";
			return response;
		}
	}

	const sources = await sauce(first_attachment.url);
	for (const source of sources) {
		response += `- [\`${source.authorName}\` posted to \`${source.site}\`](<${source.url}>) with a \`${source.similarity}\`pt.\n`;
	}

	return response;
}

/**
  * if the user's request looks like: `??sauce [link]`
	*
	* modifies the response string
 */
async function useLink(link: string) {
	let response = "## Sources found?:\n\n";

	const is_link = checkIfLink(link);
	if (!is_link) {
		response = "You did not give me a link.";
		return response;
	}
	try {
		const sources = await sauce(link);
		for (const source of sources)
			response += `- [\`${source.authorName}\` posted to \`${source.site}\`](<${source.url}>) with a \`${source.similarity}\`pt.\n`;
	} catch (err) {
		response = "An error has occured with parsing your link.";
	}

	return response;
}

export async function checker(msg: Message, args: string[]): Promise<boolean> {
	if (!args.at(0) && msg.reference?.messageId === undefined) {
		msg.reply("Reply to an image or give a link for me to search.");
		return false;
	}
	return true;
}
