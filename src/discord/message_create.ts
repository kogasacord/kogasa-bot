import { Client, Collection, DMChannel, GuildChannel, Message, ThreadChannel } from "discord.js";
import { pushMessageToBuffer } from "@helpers/buffer/buffer.js";
import { separateCommands } from "@helpers/parser/parser.js";
import {
	CommandModule,
	Cooldown,
	ExternalDependencies,
	Tier,
	DiscordExternalDependencies,
} from "@helpers/types.js";
import settings from "@root/settings.json" assert { type: "json" };
import {
	getExpiredTimestamp,
	setCooldown,
} from "@helpers/cooldown/cooldown_single.js";

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
	deps: DiscordExternalDependencies,
	prefix: string,
) {
	// make it support threads.
	if (msg.author.bot) {
		return;
	}

	await pushMessageToBuffer(client, msg, deps.chat_buffer);

	////////////////// COMMAND STUFF BELOW //////////////////
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

		const expired_timestamp = getExpiredTimestamp(
			user_cooldowns,
			command_module,
			msg.author.id
		);
		if (!expired_timestamp) {
			msg.reply(
				`Please wait, you are on a cooldown for \`${command_module.name}\`.` +
					` You can use it again <t:${expired_timestamp}:R>.`
			);
			return;
		}
		if (command_module.checker) {
			const has_passed_check = await command_module.checker(msg, args);
			if (!has_passed_check) {
				return;
			}
		}
		if (
			(command_module.channel === "DMs" && msg.channel instanceof DMChannel)
			|| (command_module.channel === "Guild" && msg.channel instanceof GuildChannel)
			|| (command_module.channel === "GuildandThread" && (msg.channel instanceof GuildChannel || msg.channel instanceof ThreadChannel))
		) {
			setCooldown(user_cooldowns, command_module, msg.author.id, args);
			const ext: ExternalDependencies = {
				commands: deps.commands,
				prefix: prefix,
				websites: deps.websites,
				tiers: tiers,
				chat_buffer: deps.chat_buffer,
				settings: settings,
				session: deps.session
			};
			command_module.execute(client, msg, args, ext);
		} else {
			msg.reply(`This command is only allowed for "${command_module.channel}". If you want to enable DM-only commands, use \`??dm\`.`);
		}

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
