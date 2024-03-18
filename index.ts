
import path from "path";
import * as url from "url";
import { Channel, Client, Collection, Options, User } from "discord.js";

import {
	ChatBuffer,
	DiscordExternalDependencies,
	Website,
} from "./src/helpers/types.js";
import { enableAutoDelete } from "./src/startup.js";
import helpers, { CommandModule } from "./src/helpers/helpers.js";

import settings from "@root/settings.json" assert { type: "json" };
import config from "@root/config.json" assert { type: "json" };

import { messageUpdate } from "./src/discord/message_update.js";
import { messageDelete } from "./src/discord/message_delete.js";
import { messageCreate } from "./src/discord/message_create.js";
import { ready } from "./src/discord/ready.js";

import { InviteManager } from "@helpers/session/invite.js";
import { SessionManager, Session, InviteK } from "@helpers/session/session.js";

///////////////////////////////////////////////////////////////////////////////////
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
const client = new Client({
	intents: ["Guilds", "GuildMessages", "MessageContent", "GuildIntegrations", "DirectMessages"],
	makeCache: Options.cacheWithLimits({
		...Options.DefaultMakeCacheSettings,
		MessageManager: 2000,
		UserManager: 100,
	}),
});
const session = new SessionManager<Session, InviteK>(new InviteManager<InviteK>());
session.on("sessionTimeout", async (info) => {
	if (!info) {
		return;
	}
	let channel: Channel | null = null;
	let players: User[] = [];
	try {
		channel = await client.channels.fetch(info.channel_id);
		players = await Promise.all(info.players.map(async (v) => await client.users.fetch(v.id)));
	} catch (error) {
		console.log(error);
	}
	if (channel?.isTextBased()) {
		// make stockfish analyze the game.
		channel.send(`\`${players[info.turn_index].displayName}\`'s potato blew up on them!`);
		setTimeout(() => {
			channel?.delete();
		}, 10 * 1000);
	}
});
session.on_invite("inviteTimeout", async (info) => {
	if (!info || !info.recipient || !info.sender) {
		return;
	}
	let channel: Channel | null = null;
	try {
		channel = await client.channels.fetch(info.recipient.channel_id);
	} catch (error) {
		console.log(error);
	}
	if (channel?.isTextBased()) {
		channel.send(`${info.sender.name}'s invite for ${info.recipient.name} has expired.`);
	}
});

///////////////////////////////////////////////////////////////////////////////////
const commands = new Collection<string, CommandModule>().concat(
	await helpers.importDirectories(__dirname, "/src/commands/"),
	await helpers.importDirectories(__dirname, "/src/commands/specials/"),
);
const websites: Website[] = await helpers.grabAllRandomWebsites(
	path.join(__dirname, "./media/randomweb.jsonl")
);
const aliases = helpers.postProcessAliases(commands);
const chat_buffer: ChatBuffer = new Map();
const other_dependencies: DiscordExternalDependencies = {
	commands,
	aliases,
	chat_buffer,
	websites,
	session
};
//////////////////////////////////////////////////////////////////////////////////
if (!settings.test) await enableAutoDelete();

client.on(
	"messageCreate",
	async (msg) => await messageCreate(client, msg, other_dependencies, settings.test ? "!!" : settings.prefix)
);
client.on(
	"messageUpdate",
	async (msg) => await messageUpdate(client, msg, chat_buffer)
);
client.on(
	"messageDelete",
	async (msg) => await messageDelete(client, msg, chat_buffer)
);
client.on("cacheSweep", (message) => {
	console.log(`Sweeped cache: ${message}`);
});
client.on("ready", (client) => ready(client, settings));
if (settings.offlineMode) {
	console.log("Running in offline mode. Exiting...");
	process.exit(0);
} else {
	client.login(settings.test ? config.test_token : config.token);
}
