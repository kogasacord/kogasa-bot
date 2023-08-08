import { ChannelType, Client, Message } from "discord.js";
import google from "googlethis";

export const name = "google";
export const cooldown = 15;
export async function execute(client: Client, msg: Message, args: string[]) {
    if (msg.channel.type !== ChannelType.GuildText) 
        return;

    const buffered: string[] = [];

    try {
        const res = await google.search(args.join(" "), {
            parse_ads: false,
            safe: !msg.channel.nsfw,
            page: 0,
        });
        if (res.weather.temperature) {
            buffered.push(`It's currently ${res.weather.temperature}C at ${res.weather.location} | Wind: ${res.weather.wind} | ${res.weather.precipitation} Precipitation`)
            msg.reply(buffered.join("\n"));
            return;
        }
        if (res.results.length > 1) {
            for (let i = 0; i < 4; i++) {
                const result = res.results.at(i);
                if (!result)
                    break;
                buffered.push(`${result.title} | <${result.url}>`);
            }
            msg.reply(buffered.join("\n"));
            return;
        }
        msg.reply(`Sorry ${msg.author.displayName}! I could not find anything...`);
    } catch (err) {
        msg.reply(`Sorry ${msg.author.displayName}! I could not find anything...`);
    }
}