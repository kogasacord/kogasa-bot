
import Pocketbase from "pocketbase";
import { Client, Message, User } from "discord.js";

import { ExternalDependencies } from "@helpers/types.js";
import {findThroughCollection} from "@helpers/pb/pb.js";
import {PBUsers} from "@helpers/helpers.js";
import {UsersParameters} from "@helpers/pb/types";


export const name = "love";
export const aliases = ["love"];
export const cooldown = 5;
export const description = "Calculate your love~\n`??love [any number of mentions]`";
export async function execute(client: Client<true>, msg: Message, args: string[], deps: ExternalDependencies) {
	const command = args[0];
	const mentions = [...msg.mentions.users.entries()];

	switch (command) {
		case "list": {
			const love_list = await getLoveList(deps.pb, true);
			msg.reply(`## Love List \n${love_list}`);
			break;
		}
		case "hatelist": {
			const hate_list = await getLoveList(deps.pb, false);
			msg.reply(`## Hate List \n${hate_list}`);
			break;
		}
		default: {
			if (mentions.length <= 1) {
				msg.reply("You need to mention at least 2 unique users!");
			} else {
				msg.reply(await getLove(client.user.id, deps.pb, mentions));
			}
			break;
		}
	}
}


async function getLove(bot_id: string, pb: Pocketbase, mentions: [string, User][]): Promise<string> {
	const {result, users, user_addition} = calculateLove(mentions, bot_id);
	const user_names = users.map(c => c.username).join("-");

	await setPBLove(pb, {
		user_id: `${user_addition}`, 
		love: result, 
		names: user_names
	});

	return `${roundByTwo(result)}%: ${getLoveResponse(result)}`;
}

async function getLoveList(pb: Pocketbase, is_ascending: boolean) {
	const users = pb.collection("users");
	const ascending = is_ascending ? "-" : "+";
	const list = await users.getList<PBUsers>(1, 5, { sort: `${ascending}love` });
	return list.items
		.map((item, i) => {
			const names = item.names.split("-").join(", ");
			return `${i + 1}: \`${roundByTwo(item.love)}%\` (${names})`;
		})
		.join("\n");
}

function calculateLove(
	mentions: [string, User][],
	bot_id: string,
) {
	let res = 0;
	const users: { id: string, username: string }[] = [];

	let user_addition = 0;
	for (const [user_id, user] of mentions) {
		users.push({
			id: user_id,
			username: user.globalName ?? user.displayName
		});
		user_addition += Number(user_id);
	}
	res += user_addition;
	return {
		result: (res / (Number(bot_id) * (mentions.length * 1.1))) * 100,
		user_addition: user_addition,
		users: users,
	};
}

/**
	* helper function to set Pocketbase's love value with the user
	*/
async function setPBLove(pb: Pocketbase, data: UsersParameters) {
	const pb_users = pb.collection("users");
	const pb_user = await findThroughCollection<PBUsers>(pb_users, "user_id", data.user_id);
	if (!pb_user) {
		return await pb_users.create<PBUsers>(data);
	}
	return await pb_users.update<PBUsers>(pb_user.id, data);
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
