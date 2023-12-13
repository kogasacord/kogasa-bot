import mime from "mime-types"
import helpers from "../helpers/helpers.js"
import { ChannelType, Client, Message } from "discord.js"

export const name = "quote"
export const aliases = ["q"]
export const cooldown = 10
export const description =
  "Reply to someone and capture a.. suspicious message."
export async function execute(client: Client, msg: Message, args: string[]) {
  if (msg.channel.type !== ChannelType.GuildText) return
  const show_boundaries = args[0] === "boundary"

  const replied =
    msg.channel.messages.cache.get(msg.reference!.messageId!) ??
    (await msg.channel.messages.fetch(msg.reference!.messageId!))

  const parsed_content = await parseQuotes(client, replied.content)

  try {
    msg.reply({
      files: [
        {
          attachment: await quote(
            parsed_content,
            replied.author.displayName,
            replied.author.displayAvatarURL({ size: 1024, extension: "png" }),
            show_boundaries,
            replied.attachments.at(0)?.contentType,
            replied.attachments.at(0)?.url
              ? {
                  url: replied.attachments.at(0)!.url ?? 0,
                  height: replied.attachments.at(0)!.height ?? 0,
                  width: replied.attachments.at(0)!.width ?? 0,
                }
              : undefined
          ),
        },
      ],
    })
  } catch (err) {
    msg.reply(`Something went wrong.`)
    console.log(err)
  }
}

export async function checker(msg: Message, args: string[]): Promise<boolean> {
  if (!(msg.reference && msg.reference.messageId)) {
    msg.reply(`You need to reply to a message in-order to quote it.`)
    return false
  }
  return true
}

async function quote(
  text: string,
  author: string,
  avatar_url: string,
  show_boundaries: boolean,
  mimetype: string | null | undefined,
  attachment?: {
    url: string
    height: number
    width: number
  }
) {
  if (attachment !== undefined && mimetype !== null && mimetype !== undefined) {
    if (mimetype.includes("image/")) {
      return helpers.quoteAttachment(
        text,
        author,
        avatar_url,
        attachment.url,
        attachment.height,
        attachment.width,
        mimetype,
        show_boundaries
      )
    }
  }
  return helpers.quoteDefault(text, author, avatar_url, show_boundaries)
}

async function parseQuotes(client: Client, str: string) {
  const parsed_mentions = await extractObjects(
    str,
    /(?<=<@)\d+(?=>)/g,
    /<@\d+>/g,
    async (extracted) => {
      const user =
        client.users.cache.get(extracted) ??
        (await client.users.fetch(extracted))
      return user.displayName ? user.displayName : user.username
    }
  )

  const parsed_emotes = parsed_mentions.replace(/<a?:[^\s]+:\d+>/g, "")

  return parsed_emotes
}

/*
 * Extracts discord's emotes and mentions from the message content.
 */
async function extractObjects(
  str: string,
  extract: RegExp,
  replace: RegExp,
  replacer: (extracted: string) => Promise<string>
) {
  let string = str.slice()
  const extracted = str.match(extract)
  for (const extract of extracted ?? []) {
    string = string.replace(replace, await replacer(extract))
  }
  return string
}
