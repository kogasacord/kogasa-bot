import startup from "./src/startup.js";
import { Client, Collection, ChannelType, Message, ActivityType } from "discord.js";
import { readdirSync } from "fs"

import settings from "./settings.json" assert { type: "json" };
import config from "./config.json" assert { type: "json" };

import { CommandModule } from "./src/helpers/types.js";


const prefix = settings.test ? "!!" : "??";

const client = new Client({
    intents: ["Guilds", "GuildMessages", "MessageContent"],
});
const commands = new Collection<string, CommandModule>();
const cooldowns = new Collection<string, Collection<string, number>>();

// refractor this: 
const commandFiles = readdirSync('./src/commands/')
    .filter(file => 
        file.endsWith(".ts"));
const specialCommandFiles = readdirSync("./src/commands/specials/")
    .filter(file => 
        file.endsWith(".ts"));

for (const file of commandFiles) {
    const command: CommandModule = await import(`./src/commands/${file}`);
    commands.set(command.name, command);
}
for (const file of specialCommandFiles) {
    const command: CommandModule = await import(`./src/commands/specials/${file}`);
    commands.set(command.name, command);
}

if (!settings.test)
    await startup();

client.on("messageCreate", async (msg) => {
    if (msg.channel.type !== ChannelType.GuildText)
        return;
    if (!msg.content.startsWith(prefix))
        return;
    if (msg.author.bot)
        return;
    
    const c = msg.content.split(" ");
    const args = msg.content.split(" ");
    const name = c[0].replace(prefix, "");
    const command = commands.get(name);
    args.shift();

    try {
        if (!command) return;
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

        const cooldownAdditional = command.dyn_cooldown 
            ? await command.dyn_cooldown(args) * 1000
            : 0;
        
        timestamps?.set(author_id, now + cooldownAdditional + cooldownAmount);
        setTimeout(() => timestamps.delete(author_id), cooldownAmount + cooldownAdditional);
        
        if (command.special) {
            command.execute(client, msg, args, commands, prefix);
        } else {
            command.execute(client, msg, args);
        }
    } catch (err) {
        console.error(err);
    }
});

client.on("ready", (client) => {
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