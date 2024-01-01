import { Client, Message } from "discord.js";
import { ExternalDependencies, Tier, Website } from "@helpers/types.js";

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
	const [websites, tiers] = external_data.external_data;

	const tier_chances = formatTiers(tiers, websites);

	msg.reply(
		"```" + tier_chances + "```" +
			"Visualization of chances: <https://www.desmos.com/calculator/veqgifgo8z>"
	);
}

function formatTiers(tiers: Map<string, Tier>, websites: Website[]) {
	let previous_tier_chance = 300;
	let format = "";

	let i = 0;
	for (const [tier_name, tier_info] of tiers.entries()) {
		let chance = 0;
		if (i === 0) {
			chance = previous_tier_chance - tier_info.chance;
		} else {
			chance = tier_info.chance - previous_tier_chance;
		}

		const website_count = websites.filter(c => c.rarity === tier_name).length;
		format += `${tier_name} websites (${website_count}) [${chance} out of 300]\n`;

		previous_tier_chance = tier_info.chance;
		i++;
	}

	return format;
}
