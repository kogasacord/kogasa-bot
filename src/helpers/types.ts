import { Queue } from "./misc/queue.js";
import { Client, Message, Collection } from "discord.js";
import settings from "@root/settings.json" assert { type: "json" };
import { ReminderEmitter } from "./reminder/reminders.js";
import { Database } from "better-sqlite3";

export type ChannelScope = "DMs" | "Guild" | "Thread";
export type CommandModule = {
	name: string;
	description: string;
	extended_description: string | undefined;
	cooldown: number;
	execute: (
		client: Client,
		msg: Message,
		args: string[],
		deps: ExternalDependencies
	) => Promise<void>;
	channel: ChannelScope[];

	dyn_cooldown?: (args: string[]) => Promise<number>;
	aliases?: string[];
	noscope?: boolean; // avoids the scope check
};
// try using this sometimes (or replace everything with it :fear:)
export type Nullable<T> = undefined | null | T;
export type ChatBufferMessage = {
	id: string;
	display_name: string;
	content: string;
	attachments: string[];
	is_deleted: boolean;
	edits: string[];
	replied: Nullable<ChatBufferMessage>;
};
export type ChatBuffer = Map<string, Queue<ChatBufferMessage>>;

// why do i have two ExternalDependencies.
// shouldn't external dependencies be handled by the messageCreate function?
export type ExternalDependencies = {
	db: Database;
	commands: Collection<string, CommandModule>;
	prefix: string;
	websites: Website[];
	tiers: [Tiers, number][];
	chat_buffer: ChatBuffer;
	settings: typeof settings;
	reminder_emitter: ReminderEmitter;
};
export type DiscordExternalDependencies = {
	db: Database;
	websites: Website[];
	chat_buffer: ChatBuffer;
	commands: Collection<string, CommandModule>;
	aliases: Map<string, string>;
	reminder_emitter: ReminderEmitter;
};
export type Tiers = "C" | "UC" | "R" | "SR" | "Q";

export type Cooldown = {
	cooldown: number;
	hasMessaged: boolean;
};
export type Website = {
	rarity: string;
	site: string;
};
// eslint-disable-next-line
export type JSONObject = { [a: string]: any }; // i will replace make this a Record<T>, gotta make sure it doesn't break stuff first though
