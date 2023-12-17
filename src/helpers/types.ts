import Pocketbase from "pocketbase";
import { Queue } from "./misc/queue.js";
import { Client, Message, Collection } from "discord.js";

export type CommandModule = {
	name: string;
	description?: string;
	cooldown: number;
	execute: (
		client: Client,
		msg: Message,
		args: string[],
		deps: ExternalDependencies
	) => void;
	dyn_cooldown?: (args: string[]) => Promise<number>;
	aliases?: string[];
	checker?: (msg: Message, args: string[]) => Promise<boolean>;
	special?: boolean; // currently does nothing
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
export type ExternalDependencies = {
	pb: Pocketbase;
	commands: Collection<string, CommandModule>;
	prefix: string;
	external_data: [Website[], Map<string, Tier>, ChatBuffer];
};
export type DiscordExternalDependencies = {
	commands: Collection<string, CommandModule>;
	aliases: Map<string, string>;
	chat_buffer: ChatBuffer;
	websites: Website[];
	settings: { test: boolean };
};
export type Cooldown = {
	cooldown: number;
	hasMessaged: boolean;
};
export type Website = {
	rarity: string;
	site: string;
};
// eslint-disable-next-line
export type JSONObject = { [a: string]: any };
export type Tier = {
	chance: number;
	name: string;
	emote: string;
} & JSONObject;
