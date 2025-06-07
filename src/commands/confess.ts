import { ExternalDependencies } from "@helpers/types";
import {
	ChannelType,
	Client,
	EmbedBuilder,
	Guild,
	GuildMember,
	Message,
	PermissionsBitField,
	TextChannel,
} from "discord.js";
import { ChannelScope } from "@helpers/types";
import { createHash } from "node:crypto";


export const name = "confess";
export const aliases = [];
export const channel: ChannelScope[] = ["DMs", "Guild"];
export const cooldown = 10;
export const description = "Secretly send a message.";
export const extended_description =
	"To confess, you must do `??confess` in DMs first and follow the instructions listed there." +
	"\nFor server owners, `??confess ban (confession number)` and `??confess ban @User` to moderate it." +
	"\n`??confess` in a channel to set it up.";
// TODO: the ability to remove the confess feature entirely.
export async function execute(
	client: Client<true>,
	msg: Message,
	args: string[],
	ext: ExternalDependencies
) {
	if (msg.channel.type === ChannelType.DM) {
		// ??confess [guild_index] [text] - confesses the text.
		// ??confess - lists down the servers they can confess in
	}
	if (msg.channel.type === ChannelType.GuildText) {
		// set confess channel by typing ??confess in, ??confess disable is allowed too.
		// warn people that confess is supposed to be done in dms, delete their message too.
	}
	msg.reply("Confess is being moved!");
}

//// DM ////
async function dm(msg: Message<boolean>) {
	
}
async function listServers() {

}
async function confess() {
	
}

//// GUILD ////
async function guild() {
	
}
async function setup() {
	
}


function hash(content: string, hash_length: number) {
	return createHash("sha256")
		.update(content)
		.digest("hex")
		.toString()
		.slice(0, hash_length);
}

