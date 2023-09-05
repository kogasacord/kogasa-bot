import chalk from "chalk";
import * as url from 'url';
import Pocketbase from "pocketbase";

import { enableAutoDelete } from "./src/startup.js";
import { Client, Collection, ChannelType, Message, ActivityType } from "discord.js";

import settings from "./settings.json" assert { type: "json" };
import config from "./config.json" assert { type: "json" };

import { CommandModule, ExternalDependencies } from "./src/helpers/types.js";
import { importDirectories } from "./src/helpers/misc/import.js";
import { commandChannelAccess } from "./src/helpers/settings/command_scope.js";
import { prefixChange } from "./src/helpers/settings/prefix.js";

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const client = new Client({
    intents: ["Guilds", "GuildMessages", "MessageContent", "GuildIntegrations"],
});
const pb = new Pocketbase("http://127.0.0.1:8090");

const commands = new Collection<string, CommandModule>()
    .concat(
        (await importDirectories(__dirname, "/src/commands/")),
        (await importDirectories(__dirname, "/src/commands/specials/")),
        (await importDirectories(__dirname, "/src/commands/settings/")),
    );
const cooldowns = new Collection<string, Collection<string, number>>();

console.log(`Imported ${chalk.bgGreen(`${commands.size} commands`)}.`)

if (!settings.test)
    await enableAutoDelete();

client.on("messageCreate", async (msg) => {
    if (msg.channel.type !== ChannelType.GuildText)
        return;

    if (msg.author.bot)
        return;

    // local prefix changing
    const prefix = await prefixChange(pb, settings.test, msg.channel.guildId);

    if (!msg.content.startsWith(prefix))
        return;

    const c = msg.content.split(" ");
    const args = msg.content.split(" ");
    const name = c[0].replace(prefix, "");
    const command = commands.get(name);
    args.shift();

    try {
        if (!command) return;
        // scoping
        if (!command.noscope) {
            const response = await commandChannelAccess(pb, name, msg.channel.id, msg.channel.guildId, prefix)
            if (response) {
                msg.reply(response);
                return;
            }
        }

        // cooldowns
        if (!cooldowns.has(command.name)) {
            cooldowns.set(command.name, new Collection());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(command.name);
        const cooldownAmount = command.cooldown * 1000;
        const author_id = msg.author.id;

        if (!timestamps) {
            return;
        }

        if (timestamps.has(author_id)) {
            const expirationTime = timestamps.get(author_id)!;
            if (now < expirationTime) {
                const expiredTimestamp = Math.round(expirationTime / 1000);
                msg.reply(
                    `Please wait, you are on a cooldown for \`${command.name}\`.`
                    + ` You can use it again <t:${expiredTimestamp}:R>.`);
            }
            return;
        }

        if (command.checker) {
            const pass = await command.checker(msg, args);
            if (!pass) {
                return;
            }
        }

        const cooldownAdditional = command.dyn_cooldown
            ? await command.dyn_cooldown(args) * 1000
            : 0;

        timestamps?.set(author_id, now + cooldownAdditional + cooldownAmount);
        setTimeout(() => timestamps.delete(author_id), cooldownAmount + cooldownAdditional);

        const ext: ExternalDependencies = {
            pb: pb,
            commands: commands,
            prefix: prefix
        }
        command.execute(client, msg, args, ext);
    } catch (err) {
        console.error(err);
    }
});

client.on("ready", async (client) => {
    console.log(`Done! [Test mode: ${settings.test}]`);
    client.user.setPresence({
        activities: [{
            name: "the Human Village",
            type: ActivityType.Watching,
        }],
        status: "online",
    })
});
client.login(settings.test ? config.test_token : config.token)
