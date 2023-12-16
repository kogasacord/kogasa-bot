import path from "path"
import Pocketbase from "pocketbase"
import { ChannelType, Client, Collection, Message } from "discord.js"
import { pushMessageToBuffer } from "../helpers/buffer/buffer.js"
import helpers from "../helpers/helpers.js"
import { separateCommands } from "../helpers/parser/parser.js"
import { implementCooldown } from "../helpers/cooldown/cooldown.js"
import {
  CommandModule,
  Cooldown,
  ExternalDependencies,
  Website,
  Tier,
  DiscordExternalDependencies,
} from "../helpers/types.js"

const pb = new Pocketbase("http://127.0.0.1:8090")
const cooldowns = new Collection<string, Collection<string, Cooldown>>()

const tiers = new Map<string, Tier>([
  ["C", { chance: 137, name: "Common", emote: ":cd:" }], // implement low_chance and high_chance to compare together
  ["UC", { chance: 220, name: "Uncommon", emote: ":comet:" }],
  ["R", { chance: 275, name: "Rare", emote: ":sparkles:" }],
  ["SR", { chance: 298, name: "Super Rare", emote: ":sparkles::camping:" }],
  ["Q", { chance: 300, name: "Flower", emote: ":white_flower:" }],
])

export async function messageCreate(
  client: Client,
  msg: Message,
  deps: DiscordExternalDependencies
) {
  if (msg.channel.type !== ChannelType.GuildText || msg.author.bot) {
    return
  }
  await pushMessageToBuffer(client, msg, deps.chat_buffer)
  const prefix = await helpers.prefixChange(
    pb,
    deps.settings.test,
    msg.channel.guildId
  )

  if (!msg.content.startsWith(prefix)) {
    return
  }

  const { args, alias_command_name } = separateCommands(msg.content, prefix)
  const command_module = aliasToCommand(
    deps.aliases,
    deps.commands,
    alias_command_name
  )

  try {
    if (!command_module) {
      return
    }
    if (!command_module.noscope) {
      if (
        !(await helpers.commandChannelAccess(
          pb,
          command_module.name,
          msg.channel.id,
          msg.guild!.id
        ))
      ) {
        msg.reply("Command can't be accessed here.")
        return
      }
    }

    implementCooldown(cooldowns, command_module, msg, args)

    const ext: ExternalDependencies = {
      pb: pb,
      commands: deps.commands,
      prefix: prefix,
      external_data: [deps.websites, tiers, deps.chat_buffer],
    }
    command_module.execute(client, msg, args, ext)
  } catch (err) {
    console.error(err)
  }
}

function aliasToCommand(
  aliases: Map<string, string>,
  commands: Collection<string, CommandModule>,
  alias: string
) {
  const command_name = aliases.get(alias)
  if (command_name) {
    return commands.get(command_name)
  }
  return commands.get(alias)
}
