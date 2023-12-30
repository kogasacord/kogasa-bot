import Pocketbase from "pocketbase";
import { ChannelType, Client, Collection, Message } from "discord.js";
import { pushMessageToBuffer } from "@helpers/buffer/buffer.js";
import helpers from "@helpers/helpers.js";
import { separateCommands } from "@helpers/parser/parser.js";
import {
	CommandModule,
	Cooldown,
	ExternalDependencies,
	Tier,
	DiscordExternalDependencies,
} from "@helpers/types.js";
import settings from "@settings" assert { type: "json" };
import { getExpiredTimestamp, setCooldown } from "@helpers/cooldown/cooldown_single";

const pb = new Pocketbase(settings.pocketbase_endpoint);
const user_cooldowns = new Collection<string, Cooldown>();

const tiers = new Map<string, Tier>([
	["C", { chance: 137, name: "Common", emote: ":cd:" }], // implement low_chance and high_chance to compare together
	["UC", { chance: 220, name: "Uncommon", emote: ":comet:" }],
	["R", { chance: 275, name: "Rare", emote: ":sparkles:" }],
	["SR", { chance: 298, name: "Super Rare", emote: ":sparkles::camping:" }],
	["Q", { chance: 300, name: "Flower", emote: ":white_flower:" }],
]);

export async function messageCreate(
	client: Client,
	msg: Message,
	deps: DiscordExternalDependencies
) {
	if (msg.channel.type !== ChannelType.GuildText || msg.author.bot) {
		return;
	}

	await pushMessageToBuffer(client, msg, deps.chat_buffer);
	const prefix = await helpers.getServerPrefix(
		pb,
		settings.test,
		msg.channel.guildId
	);

	if (!msg.content.startsWith(prefix)) {
		return;
	}

	const { args, alias_command_name } = separateCommands(msg.content, prefix);
	const command_module = aliasNameToCommand(
		deps.aliases,
		deps.commands,
		alias_command_name
	);

	try {
		if (!command_module) {
			return;
		}
		if (!command_module.noscope) {
			const is_command_allowed = await helpers.hasCommandChannelAccess(
				pb,
				command_module.name,
				msg.channel.id,
				msg.guild!.id
			);
			if (!is_command_allowed) {
				msg.reply("Command can't be accessed here.");
				return;
			}
		}

		const expired_timestamp = getExpiredTimestamp(user_cooldowns, command_module, msg.author.id);
		if (!expired_timestamp) {
			msg.reply(
				`Please wait, you are on a cooldown for \`${command_module.name}\`.` +
				` You can use it again <t:${expired_timestamp}:R>.`
			);
			return;
		}
		if (command_module.checker) {
			await command_module.checker(msg, args);
		}
		setCooldown(user_cooldowns, command_module, msg.author.id, args);

		const ext: ExternalDependencies = {
			pb: pb,
			commands: deps.commands,
			prefix: prefix,
			external_data: [deps.websites, tiers, deps.chat_buffer, settings],
		};
		command_module.execute(client, msg, args, ext);
	} catch (err) {
		console.error(err);
	}
}

function aliasNameToCommand(
	aliases: Map<string, string>,
	commands: Collection<string, CommandModule>,
	alias: string
) {
	const command_name = aliases.get(alias);
	if (command_name) {
		return commands.get(command_name);
	}
	return commands.get(alias);
}
