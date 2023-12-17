import path from "path";
import * as url from "url";
import { Client, Collection, ActivityType, Options } from "discord.js";
import {
	ChatBuffer,
	DiscordExternalDependencies,
	Website,
} from "./src/helpers/types.js";
import { enableAutoDelete } from "./src/startup.js";
import helpers, { CommandModule } from "./src/helpers/helpers.js";

import settings from "./settings.json" assert { type: "json" };
import config from "./config.json" assert { type: "json" };

import { messageUpdate } from "./src/discord/message_update.js";
import { messageDelete } from "./src/discord/message_delete.js";
import { messageCreate } from "./src/discord/message_create.js";
import { ready } from "./src/discord/ready.js";

///////////////////////////////////////////////////////////////////////////////////

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
const client = new Client({
	intents: ["Guilds", "GuildMessages", "MessageContent", "GuildIntegrations"],
	makeCache: Options.cacheWithLimits({
		...Options.DefaultMakeCacheSettings,
		MessageManager: 2000,
		UserManager: 100,
	}),
});
///////////////////////////////////////////////////////////////////////////////////
const commands = new Collection<string, CommandModule>().concat(
	await helpers.importDirectories(__dirname, "/src/commands/"),
	await helpers.importDirectories(__dirname, "/src/commands/specials/"),
	await helpers.importDirectories(__dirname, "/src/commands/settings/")
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
	settings,
	websites,
};
//////////////////////////////////////////////////////////////////////////////////
if (!settings.test) await enableAutoDelete();

client.on(
	"messageUpdate",
	async (msg) => await messageUpdate(client, msg, chat_buffer)
);
client.on(
	"messageDelete",
	async (msg) => await messageDelete(client, msg, chat_buffer)
);
client.on(
	"messageCreate",
	async (msg) => await messageCreate(client, msg, other_dependencies)
);
client.on("cacheSweep", (message) => {
	console.log(`Sweeped cache: ${message}`);
});
client.on("ready", (client) => ready(client, settings));
client.login(settings.test ? config.test_token : config.token);
