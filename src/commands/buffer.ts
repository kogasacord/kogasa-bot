import { Client, EmbedBuilder, Message } from "discord.js"
import { ChatBufferMessage, ExternalDependencies } from "../helpers/types.js"

export const name = "buffer"
export const aliases = ["back", "backtrack", "b"]
export const cooldown = 5
export const description =
  "Backtrack a channel, a command better than Small's implementation. `??buffer (delete | edit | normal | none)`"

type Filter = "delete" | "edit" | "normal" | "none"

export async function execute(
  _: Client,
  msg: Message,
  args: string[],
  external_data: ExternalDependencies
) {
  const filter_args = args.at(0)

  let filter: Filter = "none"
  if (filter_args) {
    if (["delete", "edit", "normal", "none"].includes(filter_args)) {
      filter = filter_args as Filter
    }
  }

  const queue_collection = external_data.external_data[2]
  const queue = queue_collection.get(msg.channelId)
  const embed = new EmbedBuilder().setTitle("Backtracked.").setColor("Navy")
  if (queue) {
    const messages = preprocessChatBuffer(filter, queue.get_internal())
    if (messages.length < 1) {
      msg.reply("No messages found.")
      return
    }

    let format: string[] = []

    for (const message of messages) {
      format.push(`${formatMessage(message, 4000)}\n`)
      while (format.join("").length > 4000) {
        shortenLongestString(format)
      }
    }
    embed.setDescription(format.join(""))
  } else {
    embed.setDescription("No messages found.")
  }
  msg.reply({ embeds: [embed] })
}

function limitMessageLength(message: ChatBufferMessage, maxLength: number) {
  if (message.content.length > maxLength) {
    return message.content.substring(0, maxLength)
  }
  return message.content;
}

function shortenLongestString(stringBuffer: string[]) {
  let maxLength = 0;
  let indexToRemove = -1;

  for (let i = 0; i < stringBuffer.length; i++) {
    const string = stringBuffer[i];
    if (string.length > maxLength) {
      maxLength = string.length;
      indexToRemove = i;
    }
  }

  if (indexToRemove !== -1) {
    const maxStringLength = stringBuffer[indexToRemove].length * .50;
    const longestString = stringBuffer[indexToRemove];
    const shortenedString = longestString.substring(0, maxStringLength);
    stringBuffer[indexToRemove] = shortenedString + "..." + "\n";
  }
}

function preprocessChatBuffer(filter: Filter, buffer: ChatBufferMessage[]) {
  switch (filter) {
    case "delete":
      return buffer.filter((v) => v.is_deleted === true)
    case "edit":
      return buffer.filter((v) => v.edits.length >= 1)
    case "normal":
      return buffer.filter((v) => v.is_deleted === false && v.edits.length < 1)
    case "none":
      return buffer
    default:
      return buffer
  }
}

function formatMessage(message: ChatBufferMessage, maxMessageLength: number) {
  let format = ""
  if (message.replied)
    format += `╔═ \`${message.replied.display_name}\` ${
      message.replied.is_deleted ? "[DELETED]" : ""
    }: ${message.replied.content}\n`

  format += `\`${message.display_name}\`${
    message.is_deleted ? " [DELETED]:" : ":"
  } ${message.edits.length >= 1 ? "\n" : ""}${message.edits
    .map((v) => `||${v}||\n`)
    .join("")} ${limitMessageLength(message, maxMessageLength)}`
  return format
}
