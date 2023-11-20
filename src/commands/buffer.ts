import { Client, EmbedBuilder, Message } from "discord.js"
import { ChatBufferMessage, ExternalDependencies } from "../helpers/types.js"

export const name = "buffer"
export const aliases = ["back", "backtrack", "b"]
export const cooldown = 5
export const description =
  "Backtrack a channel, a command better than Small's implementation."
export async function execute(
  _: Client,
  msg: Message,
  __: string[],
  external_data: ExternalDependencies
) {
  const queue_collection = external_data.external_data[2]
  const queue = queue_collection.get(msg.channelId)
  const embed = new EmbedBuilder().setTitle("Backtracked.").setColor("Navy")
  if (queue) {
    const messages = queue.get_internal()
    if (messages.length < 1) {
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
