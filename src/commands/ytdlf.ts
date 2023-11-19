import helpers from "../helpers/helpers.js"
import { Client, EmbedBuilder, Message } from "discord.js"

export const name = "ytdlf"
export const cooldown = 20
export const description = "Find formats for a specific YouTube video."
export async function execute(client: Client, msg: Message, args: string[]) {
  const requested_link = args[0]
  const f = await helpers.getFormats(requested_link)

  let isOver = false
  let indexer = 0
  let embed = new EmbedBuilder()
    .setTitle("Quality and Format options")
    .setDescription("~~")
  while (!isOver) {
    if (Number.isInteger((indexer + 1) / 25)) {
      msg.channel.send({ embeds: [embed] })
      embed = new EmbedBuilder()
    }
    const format = f.formats[indexer]
    if (f.formats.length <= indexer) {
      msg.channel.send({ embeds: [embed] })
      break
    }
    embed.addFields({
      name: `${format.format} [ID: ${format.format_id}]`,
      value: `Video: ${format.video_codec} | Audio: ${format.audio_codec} | Container: ${format.container}`,
    })
    indexer++
  }
}

export async function checker(msg: Message, args: string[]): Promise<boolean> {
  const requested_link = args[0]
  if (!requested_link) {
    msg.reply(`You did not give me a link to scan.`)
    return false
  }
  if (!helpers.checkIfLink(requested_link)) {
    msg.reply("You did not send me a link.")
    return false
  }
  const checks = await helpers.checkLink(requested_link)
  if (checks.reasons !== undefined && checks.reasons.length > 0) {
    msg.reply(helpers.formatCheckResults(checks))
    return false
  }
  return true
}
