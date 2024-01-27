
import { ExternalDependencies } from "@helpers/helpers.js";
import { Client, GuildChannel, Message } from "discord.js";

export const name = "set";
export const cooldown = 10;
export const special = true;
export const channel = "Guild";
export const description = "Settings.";
export const noscope = true;
export async function execute(
	client: Client,
	msg: Message<true>,
	[set, _opt1]: string[],
	{ prefix }: ExternalDependencies
) {
	if (!msg.member?.permissions.has("ManageChannels")) {
		msg.reply("You should have *at least* the ManageChannels role to use `set`.");
		return;
	}

	switch (set) {
		case "confess": {
			const mentioned_channels = msg.mentions.channels;
			if (mentioned_channels.size <= 0) {
				msg.reply(`Correct usage: \`${prefix}set confess [#channel]\``);
				break;
			}
			if (mentioned_channels.size > 1) {
				msg.reply("There should only be one confession channel.");
				break;
			}

			const mentioned_channel = mentioned_channels.at(0) as unknown as GuildChannel | undefined;

			if (mentioned_channel) {
				// CHECKER
				const is_guild_associated_with_channel = msg.guild.channels.cache.get(mentioned_channel.id) 
					?? await msg.guild.channels.fetch(mentioned_channel.id);
				if (!is_guild_associated_with_channel) {
					msg.reply("Channel not associated with server, invalid!");
					break;
				}
				// TODO: put in a relational database here
			}
			break;
		}
		default:
			msg.reply("`??set confess [#channel]`");
			break;
	}
}
