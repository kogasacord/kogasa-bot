import path from "path";
import * as url from "url";
import { Client, Collection, Options, Partials } from "discord.js";

import {
	ChatBuffer,
	DiscordExternalDependencies,
	Website,
} from "./src/helpers/types.js";
import helpers, { CommandModule } from "./src/helpers/helpers.js";

import settings from "@root/settings.json" assert { type: "json" };
import config from "@root/config.json" assert { type: "json" };

import { messageUpdate } from "./src/discord/message_update.js";
import { messageDelete } from "./src/discord/message_delete.js";
import { messageCreate } from "./src/discord/message_create.js";
import { ready } from "./src/discord/ready.js";
import { ReminderEmitter } from "@helpers/reminder/reminders.js";
import {createDatabase} from "@helpers/db/create.js";

///////////////////////////////////////////////////////////////////////////////////

const db = createDatabase(settings.db_on_memory ? ":memory:" : "sqlitev1.db");

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
const client = new Client({
	intents: [
		"Guilds",
		"GuildMessages",
		"GuildMessageReactions",
		"DirectMessageReactions",
		"MessageContent",
		"GuildIntegrations",
		"DirectMessages",
		"GuildMembers",
	],
	partials: [Partials.Channel],
	makeCache: Options.cacheWithLimits({
		...Options.DefaultMakeCacheSettings,
		MessageManager: 2000,
		UserManager: 10_000,
	}),
});
///////////////////////////////////////////////////////////////////////////////////
const commands = new Collection<string, CommandModule>().concat(
	await helpers.importCommandsFromDirectory(__dirname, "/src/commands/"),
	await helpers.importCommandsFromDirectory(__dirname, "/src/commands/specials/")
);
const websites: Website[] = await helpers.grabAllRandomWebsites(
	path.join(__dirname, "./media/randomweb.jsonl")
);
const aliases = helpers.postProcessAliases(commands);
const chat_buffer: ChatBuffer = new Map();
const reminder_emitter = new ReminderEmitter(client);

const other_dependencies: DiscordExternalDependencies = {
	reminder_emitter,
	chat_buffer,
	commands,
	websites,
	aliases,
	db,
};

client.on(
	"messageCreate",
	async (msg) =>
		await messageCreate(
			client,
			msg,
			other_dependencies,
			settings.test ? "!!" : settings.prefix
		)
);
client.on(
	"messageUpdate",
	async (msg) => await messageUpdate(client, msg, chat_buffer)
);
client.on(
	"messageDelete",
	async (msg) => await messageDelete(client, msg, chat_buffer)
);
client.on("ready", (client) => {
	ready(client, settings);
	reminder_emitter.activate();
});
if (settings.offlineMode) {
	console.log("Running in offline mode. Exiting...");
	process.exit(0);
} else {
	client.login(settings.test ? config.test_token : config.token);
}
