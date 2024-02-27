import {ExternalDependencies} from "@helpers/types";
import { Client, Message } from "discord.js";

export const name = "confess";
export const aliases = [];
export const channel = "DMs";
export const cooldown = 25;
export const description = "Secretly send a message. [in progress]";
export async function execute(client: Client, msg: Message, _args: string[], _ext: ExternalDependencies) {
	msg.reply("Currently broken.");
	// const text = args.join(" ");
	// TODO: [confess set up]
	// 					=> (get confess channel ID)
	// 					=> (set on server ID)
	// 			 [confess feat]
	// 			 		=> (get server & confess channel ID)
	// 			 		=> (send confession to channel ID)

	// msg.reply(`Confess: ${text}`); 
}
