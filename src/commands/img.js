import { ChannelType } from "discord.js";
import google from "googlethis";
export const name = "img";
export const cooldown = 15;
export const description = "Google Images.";
export async function execute(client, msg, args) {
    if (msg.channel.type !== ChannelType.GuildText)
        return;
    try {
        const buffered = [];
        const res = await google.image(args.join(" "), {
            safe: !msg.channel.nsfw,
        });
        if (res.length > 1) {
            for (let i = 0; i < 4; i++) {
                const result = res.at(i);
                if (!result)
                    break;
                buffered.push(result.url);
            }
            msg.reply(buffered.join("\n"));
            return;
        }
        msg.reply(`Dear ${msg.author.displayName}. Your images could not be found.`);
    }
    catch (err) {
        msg.reply(`Dear ${msg.author.displayName}. Your images could not be found.`);
    }
}
