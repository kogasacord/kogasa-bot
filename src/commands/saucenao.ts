import sagiri from "sagiri";
import mimetype from "mime-types";
import { Client, Message } from "discord.js";

import config from "../../config.json" assert { type: "json" };
import { checkIfLink } from "../helpers/misc/link.js";

const sauce = sagiri(config.saucenao_token, { results: 2 });

export const name = "sauce";
export const cooldown = 60;
export const description =
	"Find the sauce. Reply or send a link/attachment to me.";
export async function execute(client: Client, msg: Message, args: string[]) {
	let response = "## Sources found?:\n\n";

	if (args.at(0)) {
		const isLink = checkIfLink(args[0]);
		if (!isLink) {
			msg.reply("You did not give me a link.");
			return;
		}
		try {
			const sources = await sauce(args[0]);
			for (const source of sources)
				response += `- \`${source.authorName}\` posted to \`${source.site}\` [<${source.url}>] with a \`${source.similarity}\`pt.\n`;
			msg.reply(response);
		} catch (err) {
			msg.reply("An error has occurred with parsing your link.");
		}
		return;
	}

	if (msg.reference?.messageId !== undefined) {
		const replied = await msg.channel.messages.fetch(msg.reference.messageId);
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
			msg.reply(response);
			return;
		}
	}
}

export async function checker(msg: Message, args: string[]): Promise<boolean> {
	if (!args.at(0) && msg.reference?.messageId === undefined) {
		msg.reply(`Reply to an image or give a link for me to search.`);
		return false;
	}
	return true;
}
