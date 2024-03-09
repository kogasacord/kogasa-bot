import helpers, { ExternalDependencies } from "@helpers/helpers.js";
import { Client, Message } from "discord.js";
import { ChannelScope } from "@helpers/types";

// by percentage to 100%
// https://www.desmos.com/calculator/veqgifgo8z

export const name = "randomweb";
export const aliases = ["rweb"];
export const cooldown = 20;
export const channel: ChannelScope[] = ["Guild"];
export const description =
	"Sends a random website to you, scaled by rarity. The more rare it is, the more obscure (or goofy) the website is. Goes from Common to Super Rare. Currently using a strong random number generator.";
export async function execute(
	client: Client,
	msg: Message,
	args: string[],
	external_data: ExternalDependencies
) {
	const websites = external_data.websites;
	const tiers = external_data.tiers;
	const gacha = helpers.gachaSpecificWebsite(websites, tiers);
	if (gacha && gacha.website) {
		msg.reply(
			`:package: ||${gacha.rarity_emote} <${gacha.website.site}>|| (${
				gacha.website.rarity
			} | ${gacha.rarity_name}) ${
				gacha.rarity_name === "Flower" ? "You uncover something strange." : ""
			}`
		);
	} else {
		msg.reply(
			"I have no idea what happened to the random number generator if this message shows up." +
				`\nWebsite list length: ${websites.length}`
		);
	}
}
