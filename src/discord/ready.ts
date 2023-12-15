import helpers from "../helpers/helpers"
import {ActivityType, Client} from "discord.js"

function ready(client: Client<true>, settings: {test: boolean}) {
  console.log(`Done! [Test mode: ${settings.test}]`)
	setInterval(() => {
		const presence = helpers.pickRandom([
			"the Human Village",
			"Alice's Bed",
			"the Road to Eientei",
			"Marisa in the Forest of Magic",
			"Reimu in the Hakurei Shrine",
			"the skies",
		])
		client.user.setPresence({
			activities: [
				{
					name: presence,
					type: ActivityType.Watching,
				},
			],
			status: "online",
		})
	}, 1000 * 60);
}
