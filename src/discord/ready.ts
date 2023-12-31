import helpers from "@helpers/helpers.js";
import { ActivityType, Client } from "discord.js";

const watching_status = [
	"the Human Village",
	"Alice's Bed",
	"the Road to Eientei",
	"Marisa in the Forest of Magic",
	"Reimu in the Hakurei Shrine",
	"the skies",
];
const presence_seconds = 1000 * 60;

export function ready(client: Client<true>, settings: { test: boolean }) {
	console.log(`Done! [Test mode: ${settings.test}]`);
	setInterval(() => {
		const presence = helpers.pickRandom(watching_status);
		client.user.setPresence({
			activities: [
				{
					name: presence,
					type: ActivityType.Watching,
				},
			],
			status: "online",
		});
	}, presence_seconds);
}
