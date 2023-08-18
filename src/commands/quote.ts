import mime from "mime-types";
import { ChannelType, Client, Message } from "discord.js";
import { quoteAttachment } from "../helpers/quote/attachment.js";
import { quoteDefault } from "../helpers/quote/default.js";

export const name = "quote";
export const cooldown = 90;
export const description = "Reply to someone and capture a.. suspicious message."
export async function execute(client: Client, msg: Message) {
    if (msg.channel.type !== ChannelType.GuildText)
        return;

    if (!(msg.reference && msg.reference.messageId)) {
        msg.reply(`You need to reply to a message in-order to quote it.`)
        return;
    }
    const replied = await msg.channel.messages.fetch(msg.reference.messageId);
    const mimetype = mime.lookup(replied.attachments.at(0) 
        ? replied.attachments.at(0)!.url
        : "")
    try {
        msg.reply({
            files: [{
                attachment: await quote(
                    replied.content, 
                    replied.author.displayName,
                    replied.author.displayAvatarURL({ size: 1024 }),
                    mimetype,
                    replied.attachments.at(0)?.url
                ),
            }]
        })
    } catch (err) {
        msg.reply(`Something went wrong.`);
        console.log(err);
    }
}

async function quote(
    text: string, 
    author: string, 
    avatar_url: string,
    mimetype: string | false,
    attachment_url?: string,
) {
    if (attachment_url !== undefined && mimetype !== false) {
        if (mimetype.includes("image/")) {
            return quoteAttachment(text, author, avatar_url, attachment_url);
        }
    }
    return quoteDefault(text, author, avatar_url);
}