
import {
	Client,
	Message,
} from "discord.js";
import { ChannelScope } from "@helpers/types.js";

const dice_regex = /(?<amount>\d+)d(?<sides>\d+)/g;

export const name = "love";
export const aliases = [];
export const cooldown = 5;
export const channel: ChannelScope[] = ["Guild", "Thread", "DMs"];
export const description = "Calculate your love.";
export const extended_description = "`<prefix>love [name1] [name2] [name3] ...`";
export async function execute(
	_client: Client,
	msg: Message<true>,
	args: string[]
) {
	/*
	if (args.length < 2) {
		msg.reply("Enter at least 2 names: `??love [name1] [name2] [name3] ...`");
		return;
	}
	*/
	msg.reply("Unavailable yet.");
	return;
	/*
	if (args.length < 1) {
		msg.reply("Enter at least 1 names: `??love [name1] [name2] [name3] ...`");
		return;
	}
	const chaldean = new ChaldeanNumerologyCalculator(args[0]);

	msg.reply(
		`Destiny value: ${chaldean.calculateDestinyNumber()}\n`
		+ `Desire value: ${chaldean.calculateHeartDesire()}\n`
		+ `Personality value: ${chaldean.calculatePersonalityNumber()}\n`
	);
	*/
}

class ChaldeanNumerologyCalculator {
	private chart = new Map<string, number>();
	constructor(private name: string) {
		const groups = {
			1: ["A", "I", "J", "Q", "Y"],
			2: ["B", "K", "R"],
			3: ["C", "G", "L", "S"],
			4: ["D", "M", "T"],
			5: ["E", "H", "N", "X"],
			6: ["U", "V", "W"],
			7: ["O", "Z"],
			8: ["F", "P"],
		};

		for (const [value, keys] of Object.entries(groups)) {
			keys.forEach(key => this.chart.set(key, Number(value)));
		}
	}

	public calculateDestinyNumber(): number {
		let destiny_number = 0;
		for (const ch of this.name) {
			const val = this.chart.get(ch.toUpperCase());
			if (!val) {
				continue;
			}
			destiny_number += val;
		}
		const d = destiny_number.toString();
		
		let t = 0;
		for (const ch of d) {
			t += Number(ch) * d.length;
		}
		return t;
	}

	public calculateHeartDesire(): number {
		let desire_number = 0;
		for (const ch of this.name) {
			if (!["A", "E", "I", "O", "U"].includes(ch.toUpperCase())) {
				continue;
			}

			const val = this.chart.get(ch.toUpperCase());
			if (!val) {
				continue;
			}
			desire_number += val;
		}
		
		const d = desire_number.toString();
		let t = 0;
		for (const ch of d) {
			t += Number(ch) * d.length; // no protections when t is 0, if every letter was a vowel.
		}
		return t;
	}

	public calculatePersonalityNumber(): number {
		let personality_number = 0;
		for (const ch of this.name) {
			if (["A", "E", "I", "O", "U"].includes(ch.toUpperCase())) {
				continue;
			}

			const val = this.chart.get(ch.toUpperCase());
			if (!val) {
				continue;
			}
			personality_number += val;
		}
		
		const d = personality_number.toString();
		let t = 0;
		for (const ch of d) {
			t += Number(ch) * d.length;
		}
		return t;
	}

}

