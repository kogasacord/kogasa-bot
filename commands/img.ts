import { ChannelType, Client, Message } from "discord.js";
import google from "googlethis";

export const name = "img";
export const cooldown = 15;
export async function execute(client: Client, msg: Message, args: string[]) {
    if (msg.channel.type !== ChannelType.GuildText) 
        return;

    try {
        const buffered: string[] = [];
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
        msg.reply(`Dear ${msg.author.displayName}. Your images could not be found.`)
    } catch (err) {
        msg.reply(`Dear ${msg.author.displayName}. Your images could not be found.`)
    }
}