import { Collection } from "discord.js";
import { Cooldown } from "../types.js";
import { CommandModule } from "../types.js";
import { Message } from "discord.js";

// returns false if cooldown hasn't passed,
// returns true if cooldown has passed
export async function hasAuthorCooldownPassed(
	cooldowns: Collection<string, Collection<string, Cooldown>>,
	command_module: CommandModule,
	msg: Message,
	args: string[]
): Promise<boolean> {
	setCooldown(cooldowns, command_module.name);

	const now = Date.now();
	const author_timestamps = cooldowns.get(command_module.name)!; // typescript remove, check here if there's any errors.
	const author_id = msg.author.id;

	if (
		executeCooldownCheck(
			author_timestamps,
			msg,
			command_module.name,
			author_id,
			now
		)
	) {
		return false;
	}
	executeCommandChecker(command_module, msg, args);
	setAuthorCooldown(command_module, author_timestamps, author_id, args, now);
	return true;
}

function setCooldown(
	cooldowns: Collection<string, Collection<string, Cooldown>>,
	command_name: string
): void {
	if (!cooldowns.has(command_name)) {
		cooldowns.set(command_name, new Collection<string, Cooldown>());
	}
}

// checks if the author's cooldown has passed or not
function authorCooldownCheck(author_timestamp: Cooldown, now: number): boolean {
	if (now < author_timestamp.cooldown) {
		if (!author_timestamp.hasMessaged) {
			author_timestamp.hasMessaged = true;
		}
		return false;
	}
	return true;
}

function executeCooldownCheck(
	author_timestamps: Collection<string, Cooldown>,
	msg: Message,
	command_name: string,
	author_id: string,
	now: number
): boolean {
	const author_timestamp = author_timestamps.get(author_id);
	if (author_timestamp) {
		if (!authorCooldownCheck(author_timestamp, now)) {
			const expired_timestamp = Math.round(author_timestamp.cooldown / 1000);
			msg.reply(
				`Please wait, you are on a cooldown for \`${command_name}\`.` +
					` You can use it again <t:${expired_timestamp}:R>.`
			);
			return true;
		}
	}
	return false;
}

async function executeCommandChecker(
	command_module: CommandModule,
	msg: Message,
	args: string[]
): Promise<void> {
	if (command_module.checker) {
		const pass = await command_module.checker(msg, args);
		if (!pass) {
			return;
		}
	}
}

async function getDynamicCooldown(
	args: string[],
	dyn_cooldown?: (args: string[]) => Promise<number>
): Promise<number> {
	return dyn_cooldown ? (await dyn_cooldown(args)) * 1000 : 0;
}

async function setAuthorCooldown(
	command_module: CommandModule,
	author_timestamps: Collection<string, Cooldown>,
	author_id: string,
	args: string[],
	now: number
) {
	const cooldownAmount = command_module.cooldown * 1000;
	const cooldownAdditional = await getDynamicCooldown(
		args,
		command_module.dyn_cooldown
	);

	author_timestamps?.set(author_id, {
		cooldown: now + cooldownAdditional + cooldownAmount,
		hasMessaged: false,
	});
	setTimeout(
		() => author_timestamps.delete(author_id),
		cooldownAmount + cooldownAdditional
	);
}
