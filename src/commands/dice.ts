
import {
	Client,
	Message,
} from "discord.js";
import { ChannelScope } from "@helpers/types";
import {getRandomInt} from "@helpers/misc/random";

const dice_regex = /(?<amount>\d+)d(?<sides>\d+)/g;

export const name = "dice";
export const aliases = ["d"];
export const cooldown = 25;
export const channel: ChannelScope[] = ["Guild", "Thread", "DMs"];
export const description =
	"DnD-styled dice rolls.";
export const extended_description =
	"\n`??dice [number of dice]d[number of sides]`"
	+ "\n- `??dice 1d6`";
export async function execute(
	_client: Client,
	msg: Message<true>,
	args: string[]
) {
	const query = args.join(" ");
	if (query.length <= 0) {
		return;
	}
	const match = [...query.matchAll(dice_regex)].at(0);
	if (!match?.groups) {
		msg.reply(
			"Your query is malformed. The valid way to do it is: `??dice [number of dice]d[number of sides]`"
		);
		return;
	}
	const amount = isNaN(Number(match.groups.amount)) ? 0 : Number(match.groups.amount);
	const sides = isNaN(Number(match.groups.sides)) ? 0 : Number(match.groups.sides);
	if (sides <= 0 || amount <= 1) {
		msg.reply(`\`${amount}d${sides}\` is an invalid dice roll. \`1d2\` is the minimum dice roll.`);
		return;
	}

	const dice_rolls: number[] = [];
	let total = 0;
	for (let i = 0; i < amount; i++) {
		const ran = getRandomInt(1, sides);
		dice_rolls.push(ran); 
		total += ran;
	}
	msg.reply(`[Rolls: ${dice_rolls.join(" ")}] = ${total}`);
}
