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
		res += Number(user_id);
	}
	res /= Number(client.user.id) * 2;
	res *= 100;

	msg.reply(`${roundByTwo(res)}%: ${getLoveResponse(res)}`);
}

function roundByTwo(num: number) {
	return Math.round((num + Number.EPSILON) * 100) / 100;
}

function getLoveResponse(num: number) {
	if (num < 10) {
		return ":headstone: Enemies.";
	}
	if (num < 30) {
		return ":bomb: Not a good start.";
	}
	if (num < 60) {
		return ":love_letter: Cute.";
	}
	if (num < 90) {
		return ":sunrise: :heart: That's a match!";
	}

	// if more than or equal to 90
	return ":gem: :sparkling_heart: That's a very good match!";
}
