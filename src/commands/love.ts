import { Client, Message } from "discord.js";

const bot_id = "918449308532092928";

export const name = "love";
export const aliases = ["love"];
export const cooldown = 5;
export const description = "Calculate your love~\n`??love [any number of mentions]`";
export async function execute(client: Client<true>, msg: Message, _args: string[]) {
	const mentions = [...msg.mentions.users.entries()];
	if (mentions.length <= 1) {
		msg.reply("You need to mention at least 2 users!");
		return;
	}

	let res = 0;

	for (const [user_id] of mentions) {
		if (user_id === bot_id) {
			msg.reply("You can't date me!");
			return;
		}
		res += Number(user_id);
	}
	res /= Number(client.user.id) * (mentions.length / 1.1);
	res *= 100;

	msg.reply(`${roundByTwo(res)}%: ${getLoveResponse(res)}`);
}

function roundByTwo(num: number) {
	return Math.round((num + Number.EPSILON) * 100) / 100;
}

function getLoveResponse(num: number) {
	if (num < 20) {
		return ":headstone: Enemies.";
	}
	if (num <= 50) {
		return ":bomb: It's alright.";
	}
	if (num <= 75) {
		return ":love_letter: Cute. It might be a match.";
	}
	if (num < 90) {
		return ":sunrise: :heart: That's a match!";
	}

	// if more than or equal to 90
	return ":gem: :sparkling_heart: That's a very good match!";
}
