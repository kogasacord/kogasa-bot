
import { Client, Message, User } from "discord.js";

export const name = "love";
export const aliases = ["love"];
export const cooldown = 5;
export const channel = "Guild";
export const description = "Calculate your love~\n`??love [any number of mentions]`";
export async function execute(client: Client<true>, msg: Message, args: string[]) {
	const command = args[0];
	const mentions = [...msg.mentions.users.entries()];

	switch (command) {
		case "list": 
		case "hatelist": {
			msg.reply("Removed.");
			break;
		}
		default: {
			if (mentions.length <= 1) {
				msg.reply("You need to mention at least 2 unique users!");
			} else {
				msg.reply(await getLove(client.user.id, mentions));
			}
			break;
		}
	}
}

async function getLove(bot_id: string, mentions: [string, User][]): Promise<string> {
	const {result} = calculateLove(mentions, bot_id);

	return `${roundByTwo(result)}%: ${getLoveResponse(result)}`;
}

function calculateLove(
	mentions: [string, User][],
	bot_id: string,
) {
	let res = 0;
	const users: { id: string, username: string }[] = [];

	let user_addition = 0;
	let divisor = 0;

	for (const [user_id, user] of mentions) {
		divisor += (user.username.charCodeAt(0) / 60);
		users.push({
			id: user_id,
			username: user.globalName ?? user.displayName,
		});
		user_addition += Number(user_id);
	}
	divisor = divisor / mentions.length;
	console.log(divisor);
	res += user_addition;

	return {
		result: (res / (Number(bot_id) * (mentions.length * divisor))) * 100,
		user_addition: user_addition,
		users: users,
	};
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
