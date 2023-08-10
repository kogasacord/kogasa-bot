import { ChannelType, Client, Message, MessageType } from "discord.js";

export const name = "quote";
export const cooldown = 1;
export async function execute(client: Client, msg: Message) {
    if (msg.channel.type !== ChannelType.GuildText)
        return;

    if (!(msg.reference && msg.reference.messageId)) {
        msg.reply(`You need to reply to a message in-order to quote it.`)
        return;
    }
    const replied = await msg.channel.messages.fetch(msg.reference.messageId);
    msg.reply({
        files: [{
            attachment: await quote(
                replied.content, 
                replied.author.displayName,
                msg.author.displayAvatarURL({ size: 4096 }),
            ),
        }]
    })
}

async function quote(text: string, author: string, avatar_url: string) {
    const check = await fetch("http://localhost:4000/quote", {
        method: "POST",
        body: JSON.stringify({
            text: text,
            author: author,
            url: avatar_url,
        }),
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    });
    return Buffer.from(await check.arrayBuffer());
}