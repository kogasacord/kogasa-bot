import {ExternalDependencies} from "@helpers/types";
import { Client, Message } from "discord.js";

export const name = "confess";
export const aliases = ["c"];
export const channel = "DMs";
export const cooldown = 25;
export const description = "Secretly send a message.";
export async function execute(client: Client, msg: Message, args: string[], _ext: ExternalDependencies) {
	const text = args.join(" ");
	// TODO: [confess set up]
	// 					=> (get confess channel ID)
	// 					=> (set on server ID)
	// 			 [confess feat]
	// 			 		=> (get server & confess channel ID)
	// 			 		=> (send confession to channel ID)
	msg.reply(`Confess: ${text}`);
}
