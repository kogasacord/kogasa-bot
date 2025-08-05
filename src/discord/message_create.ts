import {
	Client,
	Collection,
	DMChannel,
	GuildChannel,
	Message,
	ThreadChannel,
} from "discord.js";
import { pushMessageToBuffer } from "@helpers/buffer/buffer.js";
import {
	Tiers,
	Cooldown,
	ExternalDependencies,
	DiscordExternalDependencies,
} from "@helpers/types.js";
import settings from "@root/settings.json" assert { type: "json" };
import {
	getExpiredTimestamp,
	setCooldown,
} from "@helpers/cooldown/cooldown_single.js";
import { ChannelScope } from "@helpers/types.js";
import { aliasNameToCommand } from "@helpers/misc/discordhelpers";

const user_cooldowns = new Collection<string, Cooldown>();

const tiers: [Tiers, number][] = [
	["C", 0.5],
	["UC", 0.3],
	["R", 0.15],
	["SR", 0.04999],
	["Q", 0.0001],
];
const channel_types: [
	typeof GuildChannel | typeof ThreadChannel | typeof DMChannel,
	ChannelScope,
][] = [
	[DMChannel, "DMs"],
	[GuildChannel, "Guild"],
	[ThreadChannel, "Thread"],
];

export async function messageCreate(
	client: Client,
	msg: Message,
	deps: DiscordExternalDependencies,
	prefix: string
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
		if (expired_timestamp) {
			msg.reply(
				`Please wait, you are on a cooldown for \`${command_module.name}\`.` +
					` You can use it again <t:${expired_timestamp}:R>.`
			);
			return;
		}

		if (
			channel_types.some(
				([t, scope]) =>
					command_module.channel.includes(scope) && msg.channel instanceof t
			)
		) {
			setCooldown(user_cooldowns, command_module, msg.author.id, args);
			const ext: ExternalDependencies = {
				db: deps.db,
				commands: deps.commands,
				prefix: prefix,
				websites: deps.websites,
				tiers: tiers,
				chat_buffer: deps.chat_buffer,
				settings: settings,
				reminder_emitter: deps.reminder_emitter,
			};
			command_module.execute(client, msg, args, ext)
				.catch((err) => {
					msg.reply("Something went wrong when processing your request!");
					console.log("NON-FATAL: ", err);
				});
		}
	} catch (err) {
		console.error(err);
	}
}


function separateCommands(message_content: string, prefix: string) {
	// maybe i should write something better for this (O~O)
	const args = parseArgs(message_content);
	const alias_command_name = args[0].replace(prefix, "");
	return { args: args.slice(1), alias_command_name };
}

/**
	* Splits by whitespace while preserving quotation marks with whitespace in them.
	* example: arg0 "argu ment 1" args2
*/
function parseArgs(inp: string) {
	const args: string[] = [];
	let buffer = "";
	let in_quote = false;
	for (const ch of inp) {
		switch (ch) {
			case "\"": {
				if (in_quote && buffer.length > 0) {
					args.push(buffer.trim());
					buffer = "";
				}
				in_quote = !in_quote;
				break;
			}
			case " ": {
				if (!in_quote && buffer.length > 0) {
					args.push(buffer);
					buffer = "";
				}
				if (in_quote) {
					buffer += ch;
				}
				break;
			}
			default: {
				buffer += ch;
				break;
			}
		}
	}

	if (!in_quote && buffer.length > 0) {
		args.push(buffer.trim());
	}

	return args;
}
