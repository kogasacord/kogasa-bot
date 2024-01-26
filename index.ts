import path from "path";
import * as url from "url";
import { Client, Collection, Options } from "discord.js";
import { JSONFilePreset } from "lowdb/node";

import {
	ChatBuffer,
	DiscordExternalDependencies,
	Website,
	DBData,
} from "./src/helpers/types.js";
import { enableAutoDelete } from "./src/startup.js";
import helpers, { CommandModule } from "./src/helpers/helpers.js";

import settings from "@root/settings.json" assert { type: "json" };
import config from "@root/config.json" assert { type: "json" };

import { messageUpdate } from "./src/discord/message_update.js";
import { messageDelete } from "./src/discord/message_delete.js";
import { messageCreate } from "./src/discord/message_create.js";
import { ready } from "./src/discord/ready.js";

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
///////////////////////////////////////////////////////////////////////////////////

const default_db: DBData = {
	servers: { 
		"0": {
			channel: {"0": "confession"},
		},
	},
};
// [confession command] 
// 		=> (gets from db what channel it should send to)
// 		=> [sends the confession on the specified channel]
const db = await JSONFilePreset<DBData>("db.json", default_db);
setInterval(() => {
	db.write(); // writes to file every 3 seconds to avoid major slowdown
}, 3000);

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
	db,
	commands,
	aliases,
	chat_buffer,
	websites,
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
client.login(settings.test ? config.test_token : config.token);
