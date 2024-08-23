
import { ChannelType, Client, EmbedBuilder, Message } from "discord.js";
import google from "googlethis";
import { ChannelScope } from "@helpers/types";

export const name = "google";
export const cooldown = 1;
export const description = "Google.";
export const extended_description = "`??google [search input]`";
export const channel: ChannelScope[] = ["Guild", "DMs"];
export async function execute(client: Client, msg: Message, args: string[]) {
	if (msg.channel.type !== ChannelType.GuildText) return;
	const embed = new EmbedBuilder();

	try {
		const res = await google.search(args.join(" "), {
			safe: !msg.channel.nsfw,
			parse_ads: false,
			page: 0,
		});
		const first_result = res.results.at(0);
		console.log(res.did_you_mean);
		embed.setTitle("aaa");
	} catch (err) {
		console.log(`[img.ts]: ${err}`);
	}
}
