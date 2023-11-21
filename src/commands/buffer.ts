import { Client, EmbedBuilder, Message } from "discord.js"
import { ChatBufferMessage, ExternalDependencies } from "../helpers/types.js"

export const name = "buffer"
export const aliases = ["back", "backtrack", "b"]
export const cooldown = 5
export const description =
  "Backtrack a channel, a command better than Small's implementation."

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
      format.push(`${formatMessage(message)}\n`)
      if (format.join("").length > 4096) {
        format.shift()
      }
    }

    embed.setDescription(format.join(""))
  } else {
    embed.setDescription("No messages found.")
  }
  msg.reply({ embeds: [embed] })
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

function formatMessage(message: ChatBufferMessage) {
  let format = ""
  if (message.replied)
    format += `╔═ \`${message.replied.display_name}\` ${
      message.replied.is_deleted ? "[DELETED]" : ""
    }: ${message.replied.content}\n`

  format += `\`${message.display_name}\`${
    message.is_deleted ? " [DELETED]:" : ":"
  } ${message.edits.length >= 1 ? "\n" : ""}${message.edits
    .map((v) => `||${v}||\n`)
    .join("")} ${message.content}`
  return format
}
