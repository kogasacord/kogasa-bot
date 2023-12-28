import sagiri from "sagiri";
import mimetype from "mime-types";
import { Client, Message } from "discord.js";

import config from "@config" assert { type: "json" };
import { checkIfLink } from "@helpers/misc/link.js";


const sauce = sagiri(config.saucenao_token, { results: 2 });

export const name = "sauce";
export const cooldown = 60;
export const description =
	"Find the sauce. Reply or send a link/attachment to me.";
export async function execute(client: Client, msg: Message, args: string[]) {
	const response = "## Sources found?:\n\n";

	if (args.at(0)) {
		useLink(response, args.at(0)!);
	}

	if (msg.reference?.messageId !== undefined) {
		useAttachments(msg, msg.reference.messageId, response);
	}
}

/**
	* if the user's request looks like: `??sauce` [replying to someone's image attachment];
	*/
async function useAttachments(msg: Message, messageId: string, response: string) {
	const replied = await msg.channel.messages.fetch(messageId);
	const first_attachment = replied.attachments.at(0);
	if (first_attachment) {
		const mime_lookup = mimetype.lookup(first_attachment.url);
		if (mime_lookup) {
			const match = mime_lookup.match(/image\/.+/);
			if (!match?.[0]) {
				msg.reply("You given me a non-image.");
				return;
			}
		}

		const sources = await sauce(first_attachment.url);
		for (const source of sources)
			response += `- \`${source.authorName}\` posted to \`${source.site}\` [<${source.url}>] with a \`${source.similarity}\`pt.\n`;
	}
	msg.reply(response);
}

/**
	* if the user's request looks like: `??sauce [link]`
	*/
async function useLink(response: string, link: string) {
	const is_link = checkIfLink(link);
	if (!is_link) {
		response = "You did not give me a link.";
		return;
	}
	try {
		const sources = await sauce(link);
		for (const source of sources)
			response += `- \`${source.authorName}\` posted to \`${source.site}\` [<${source.url}>] with a \`${source.similarity}\`pt.\n`;
	} catch (err) {
		response = "An error has occured with parsing your link.";
	}
}

export async function checker(msg: Message, args: string[]): Promise<boolean> {
	if (!args.at(0) && msg.reference?.messageId === undefined) {
		msg.reply("Reply to an image or give a link for me to search.");
		return false;
	}
	return true;
}
