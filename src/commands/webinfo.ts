import { Client, Message } from "discord.js";
import { ExternalDependencies } from "@helpers/types.js";

export const name = "randomwebinfo";
export const aliases = ["rwebinfo"];
export const cooldown = 15;
export const description =
	"Information about randomweb. It will come with tracking your collected websites soon.";
export async function execute(
	client: Client,
	msg: Message,
	args: string[],
	external_data: ExternalDependencies
) {
	const websites = external_data.external_data[0];
	const tiers = external_data.external_data[1];

	msg.reply( // should I fix this?
		"```" +
			`C Websites count: ${websites.filter((v) => v.rarity === "C").length} | ${
				300 - tiers.get("C")!.chance
			} out of 300\n` +
			`UC Websites count: ${
				websites.filter((v) => v.rarity === "UC").length
			} | ${tiers.get("UC")!.chance - tiers.get("C")!.chance} out of 300\n` +
			`R Websites count: ${
				websites.filter((v) => v.rarity === "R").length
			}  | ${tiers.get("R")!.chance - tiers.get("UC")!.chance} out of 300\n` +
			`SR Websites count: ${
				websites.filter((v) => v.rarity === "SR").length
			} | ${tiers.get("SR")!.chance - tiers.get("R")!.chance} out of 300\n` +
			`Q Websites count: ${websites.filter((v) => v.rarity === "Q").length} | ${
				tiers.get("Q")!.chance - tiers.get("SR")!.chance
			} out of 300\n` +
			"```" +
			"Visualization of chances: <https://www.desmos.com/calculator/veqgifgo8z>"
	);
}
