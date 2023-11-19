import { Client, Message, ChannelType, PermissionsBitField } from "discord.js"
import { CommandModule, ExternalDependencies } from "../../helpers/types.js"
import {
  ChannelIDsSettings,
  CommandSettings,
  ServerSettings,
  ServerSettingsParameters,
} from "../../helpers/pb/types.js"
import { RecordService } from "pocketbase"
import { findThroughCollection } from "../../helpers/pb/pb.js"

export const name = "set"
export const cooldown = 5
export const description =
  'Settings for server owners or moderators to set. `??set [command_name/"all"] [channel_id/"all"] [true/false]`'
export const noscope = true
export async function execute(
  client: Client,
  msg: Message,
  args: string[],
  ext: ExternalDependencies
) {
  if (msg.channel.type !== ChannelType.GuildText) return
  if (!msg.member?.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
    msg.reply(
      `You would need to have a \`Manage Guild\` permission to edit or create the settings.`
    )
    return
  }

  const selector = args.at(0)
  const channel_id = args.at(1)
  const isEnabledStr = args.at(2)

  const settings = ext.pb.collection("server_settings")
  const command_scopes = ext.pb.collection("command_scopes")
  const channel_ids = ext.pb.collection("channel_ids")
  const server_setting = await findThroughCollection<ServerSettings>(
    settings,
    "serverid",
    msg.channel.guildId
  )
  const server_id = msg.channel.guild.id
  const guild =
    client.guilds.cache.get(server_id) ?? (await client.guilds.fetch(server_id))

  if (!server_setting) {
    // init
    const re = await msg.reply(`Creating default settings.`)
    const def = await initializeSettings(settings, msg.channel.guild.id)
    await re.edit(
      `Created settings on ${def.serverid} with \`prefix: ${def.prefix}\``
    )
    return
  }

  if (!selector) {
    msg.reply(
      `Select a selector like so: \`??set ping [channel_id/\"all\"] [true/false]\``
    )
    return
  }
  if (!(channel_id && isEnabledStr)) {
    msg.reply(
      `\`??set [command_name/\"all\"] [channel_id/\"all\"] [true/false]\``
    )
    return
  }

  const isEnabled = isEnabledStr.toLowerCase() === "true"

  const commands: CommandModule[] = []
  if (selector === "all") {
    for (const command of ext.commands) {
      commands.push(command[1])
    }
  } else {
    const command = ext.commands.get(selector)
    if (!command) {
      msg.reply("Command not found!")
      return
    }
    commands.push(command)
  }

  if (channel_id === "all") {
    for (const command of commands) {
      for (const channel of guild.channels.cache) {
        await createCommandScope(
          command_scopes,
          channel_ids,
          settings,
          command.name,
          channel[1].id,
          isEnabled,
          server_setting.id
        )
      }
    }

    msg.reply(
      `${isEnabled ? "Activated" : "Disabled"} \`${commands
        .map((c) => c.name)
        .join(", ")}\` to every channel here.`
    )
  } else {
    const isMatching = await checkMatchingServerChannelIDs(
      client,
      channel_id,
      msg.channel.guild.id
    )
    if (!isMatching) {
      msg.reply("Non-matching serverIDs and channelIDs, cheeky.")
      return
    }
    let message = ""
    for (const command of commands) {
      const scope = await createCommandScope(
        command_scopes,
        channel_ids,
        settings,
        command.name,
        channel_id,
        isEnabled,
        server_setting.id
      )
      message = `${isEnabled ? "Activated" : "Disabled"} \`${formatScope(
        scope
      )}\` into this channel.`
    }
    msg.reply(message)
  }
}

async function createCommandScope(
  command_scopes: RecordService,
  channel_ids: RecordService,
  settings: RecordService,
  command_name: string,
  channel_id: string,
  isEnabled: boolean,
  server_setting_id: string
) {
  const channel = await findThroughCollection<ChannelIDsSettings>(
    channel_ids,
    "channel_id",
    channel_id
  )
  if (channel) {
    const channel_record = await channel_ids.getOne<
      ChannelIDsSettings<CommandSettings>
    >(channel.id, { expand: "command_scope" })
    const scope = await command_scopes.update(
      channel_record.expand.command_scope.id,
      {
        [command_name]: isEnabled,
      }
    )
    return scope
  } else {
    const scope = await command_scopes.create<CommandSettings>({
      [command_name]: isEnabled,
    })
    const channel_id_record = await channel_ids.create<ChannelIDsSettings>({
      channel_id: channel_id,
      command_scope: scope.id,
    })
    await settings.update(server_setting_id, {
      "channel_ids+": channel_id_record.id,
    })
    return scope
  }
}

async function initializeSettings(settings: RecordService, guildID: string) {
  const default_settings: ServerSettingsParameters = {
    serverid: guildID,
    nsfw: false,
    self_quote: true,
  }
  return await settings.create<ServerSettings>(default_settings)
}

function formatScope(scope: CommandSettings) {
  let beginning = ""
  Object.entries(scope).forEach((v) => {
    if (v[1] === true) beginning += `${v[0]}, `
  })
  return beginning
}

async function checkMatchingServerChannelIDs(
  client: Client,
  channel_id: string,
  server_id: string
) {
  const guild =
    client.guilds.cache.get(server_id) ?? (await client.guilds.fetch(server_id))
  const channel = guild.channels.cache.get(channel_id)
  return channel ? true : false
}
