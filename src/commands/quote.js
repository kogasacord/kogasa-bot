import mime from "mime-types";
import { ChannelType } from "discord.js";
import { quoteAttachment } from "../helpers/quote/attachment.js";
import { quoteDefault } from "../helpers/quote/default.js";
export const name = "quote";
export const cooldown = 5;
export const description = "Reply to someone and capture a.. suspicious message.";
export async function execute(client, msg) {
    if (msg.channel.type !== ChannelType.GuildText)
        return;
    const replied = msg.channel.messages.cache.get(msg.reference.messageId)
        ?? await msg.channel.messages.fetch(msg.reference.messageId);
    const mimetype = mime.lookup(replied.attachments.at(0)
        ? replied.attachments.at(0).url
        : "");
    const parsed_content = await parseQuotes(client, replied.content);
    try {
        msg.reply({
            files: [{
                    attachment: await quote(parsed_content, replied.author.displayName, replied.author.displayAvatarURL({ size: 1024 }), mimetype, replied.attachments.at(0)?.url),
                }]
        });
    }
    catch (err) {
        msg.reply(`Something went wrong.`);
        console.log(err);
    }
}
export async function checker(msg, args) {
    if (!(msg.reference && msg.reference.messageId)) {
        msg.reply(`You need to reply to a message in-order to quote it.`);
        return false;
    }
    return true;
}
async function quote(text, author, avatar_url, mimetype, attachment_url) {
    if (attachment_url !== undefined && mimetype !== false) {
        if (mimetype.includes("image/")) {
            return quoteAttachment(text, author, avatar_url, attachment_url);
        }
    }
    return quoteDefault(text, author, avatar_url);
}
async function parseQuotes(client, str) {
    const parsed_mentions = await extractObjects(str, /(?<=<@)\d+(?=>)/g, /<@\d+>/g, async (extracted) => {
        const user = client.users.cache.get(extracted) ?? await client.users.fetch(extracted);
        return user.displayName
            ? user.displayName
            : user.username;
    });
    const parsed_emotes = await extractObjects(parsed_mentions, /(?<=<:(.+?))\d+(?=>)/g, /<:(.+?):\d+>/g, async (extracted) => {
        // placeholder for the replacement algorithm for emojis
        return "";
    });
    return parsed_emotes;
}
async function extractObjects(str, extract, replace, replacer) {
    let string = str.slice();
    const extracted = str.match(extract);
    for (const extract of extracted ?? []) {
        string = string.replace(replace, await replacer(extract));
    }
    return string;
}