import { ChannelType } from "discord.js";
import google from "googlethis";
export const name = "google";
export const cooldown = 15;
export const description = "Google.";
export async function execute(client, msg, args) {
    if (msg.channel.type !== ChannelType.GuildText)
        return;
    const buffered = [];
    try {
        const res = await google.search(args.join(" "), {
            parse_ads: false,
            safe: !msg.channel.nsfw,
            page: 0,
        });
        if (res.weather.temperature) {
            buffered.push(`It's currently ${res.weather.temperature}C at ${res.weather.location} | Wind: ${res.weather.wind} | ${res.weather.precipitation} Precipitation`);
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
    }
    catch (err) {
        msg.reply(`Sorry ${msg.author.displayName}! I could not find anything...`);
    }
}
