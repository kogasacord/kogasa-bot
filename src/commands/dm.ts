
import { Client, Message } from "discord.js";
import { ChannelScope } from "@helpers/types";

export const name = "dm";
export const aliases = [];
export const channel: ChannelScope[] = ["Guild"];
export const cooldown = 120;
export const description = "Enable DM-only commands, like ??confess.";
export async function execute(_client: Client, msg: Message) {
	const dm = await msg.author.createDM();
	const message = "Hello! Sorry for this but this is a band-aid solution for discord.js behaviour."
		+ " It doesn't read DMs from people unless I send them a message."
		+ "\nAlso, you might need to redo this command because sometimes your DM goes away for no reason. >:( Annoying.";
	await dm.send(message);
}
