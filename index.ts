import { Client, Collection, ChannelType, Message } from "discord.js";
import { readdirSync } from "fs"
import config from "./config.json" assert { type: "json" };

const prefix = "??";

type CommandModule = { 
    name: string,
    execute: (client: Client, msg: Message, args: string[]) => void,
    cooldown: number,
    dyn_cooldown?: (author_id: string, args: string[]) => number
};

const client = new Client({
    intents: ["Guilds", "GuildMessages", "MessageContent"],
});
const commands = new Collection<string, CommandModule>();

const cooldowns = new Collection<string, Collection<string, number>>();

const commandFiles = readdirSync('./commands/')
    .filter(file => 
        file.endsWith('.ts'));

for (const file of commandFiles) {
    const command: CommandModule = await import(`./commands/${file}`);
    commands.set(command.name, command);
}

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
        let cooldownAdditional = 0;
        if (command.dyn_cooldown) {
            cooldownAdditional = command.dyn_cooldown(author_id, args) * 1000;
        }

        if (!timestamps) {
            return;
        }

        if (timestamps.has(author_id)) {
            const expirationTime = timestamps.get(author_id)! + (cooldownAmount + cooldownAdditional);
            if (now < expirationTime) {
                const expiredTimestamp = Math.round(expirationTime / 1000);
                msg.reply(
                    `Please wait, you are on a cooldown for \`${command.name}\`.`
                    + ` You can use it again at <t:${expiredTimestamp}:R>.`);
                return;
            }
        } else {
            timestamps?.set(author_id, now);
            setTimeout(() => timestamps.delete(author_id), cooldownAmount);
            command.execute(client, msg, args);
        }
    } catch (err) {
        console.error(err);
    }
});

client.on("ready", () => console.log("Done!"));
client.login(config.token)