import { ChannelType, Client, Message } from "discord.js";
import google from "googlethis";
import { ChannelScope } from "@helpers/types";

export const name = "img";
export const cooldown = 15;
export const description = "Google Images.";
export const extended_description = "`??img [search input]`";
export const channel: ChannelScope[] = ["Guild", "DMs"];
export async function execute(client: Client, msg: Message, args: string[]) {
	if (msg.channel.type !== ChannelType.GuildText) return;

	try {
		const buffered: string[] = [];
		const res = await google.image(args.join(" "), {
			safe: !msg.channel.nsfw,
		});
		if (res.length > 1) {
			for (let i = 0; i < 4; i++) {
				const result = res.at(i);
				if (!result) break;
				buffered.push(`[${i + 1}](${result.url})`);
			}
			msg.reply(buffered.join(" "));
			return;
		}
	} catch (err) {
		console.log(`[img.ts]: ${err}`);
	}
	msg.reply(`Dear ${msg.author.displayName}. Your images could not be found.`);
}
