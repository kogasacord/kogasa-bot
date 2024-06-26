import { Client, Message } from "discord.js";
import { ExternalDependencies, Website } from "@helpers/types.js";
import { ChannelScope } from "@helpers/types.js";

export const name = "randomwebinfo";
export const aliases = ["rwebinfo"];
export const cooldown = 15;
export const channel: ChannelScope[] = ["Guild"];
export const description =
	"Information about randomweb. It will come with tracking your collected websites soon.";
export async function execute(
	client: Client,
	msg: Message,
	args: string[],
	external_data: ExternalDependencies
) {
	const websites = external_data.websites;
	const tiers = external_data.tiers;

	let t = "";
	for (const [name, chance] of tiers) {
		t += `${name} (${chance * 100}%)\n`;
	}

	msg.reply(
		"```" +
			t +
		"```"
	);
}

