import chalk from "chalk";
import * as url from 'url';
import path from "path";
import Pocketbase from "pocketbase";
import { enableAutoDelete } from "./src/startup.js";
import { Client, Collection, ChannelType, ActivityType } from "discord.js";
import settings from "./settings.json" assert { type: "json" };
import config from "./config.json" assert { type: "json" };
import { importDirectories } from "./src/helpers/misc/import.js";
import { commandChannelAccess } from "./src/helpers/settings/command_scope.js";
import { prefixChange } from "./src/helpers/settings/prefix.js";
import { grabAllRandomWebsites } from "./src/helpers/misc/random.js";
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const client = new Client({
    intents: ["Guilds", "GuildMessages", "MessageContent", "GuildIntegrations"],
});
const pb = new Pocketbase("http://127.0.0.1:8090");
const commands = new Collection()
    .concat((await importDirectories(__dirname, "/src/commands/")), (await importDirectories(__dirname, "/src/commands/specials/")), (await importDirectories(__dirname, "/src/commands/settings/")));
const cooldowns = new Collection();
console.log(`Imported ${chalk.bgGreen(`${commands.size} commands`)}.`);
const websites = await grabAllRandomWebsites(path.join(__dirname, "./media/randomweb.jsonl"));
console.log(`Imported ${websites.length} websites.`);
const tiers = new Map([
    ["C", { chance: 137, name: "Common", emote: ":cd:" }],
    ["UC", { chance: 220, name: "Uncommon", emote: ":comet:" }],
    ["R", { chance: 275, name: "Rare", emote: ":sparkles:" }],
    ["SR", { chance: 299, name: "Super Rare", emote: ":sparkles::camping:" }],
    ["Q", { chance: 300, name: "Flower", emote: ":white_flower:" }]
]);
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
        if (!command)
            return;
        // scoping
        if (!command.noscope) {
            const response = await commandChannelAccess(pb, name, msg.channel.id, msg.channel.guildId);
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
            const expirationTime = timestamps.get(author_id);
            if (now < expirationTime.cooldown) {
                const expiredTimestamp = Math.round(expirationTime.cooldown / 1000);
                if (!expirationTime.hasMessaged) {
                    msg.reply(`Please wait, you are on a cooldown for \`${command.name}\`.`
                        + ` You can use it again <t:${expiredTimestamp}:R>.`);
                    expirationTime.hasMessaged = true;
                }
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
        timestamps?.set(author_id, {
            cooldown: now + cooldownAdditional + cooldownAmount,
            hasMessaged: false,
        });
        setTimeout(() => timestamps.delete(author_id), cooldownAmount + cooldownAdditional);
        const ext = {
            pb: pb,
            commands: commands,
            prefix: prefix,
            external_data: [websites, tiers]
        };
        command.execute(client, msg, args, ext);
    }
    catch (err) {
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
    });
});
client.login(settings.test ? config.test_token : config.token);
