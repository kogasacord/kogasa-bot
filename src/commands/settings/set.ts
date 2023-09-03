import { Client, Message, ChannelType, PermissionsBitField } from "discord.js";
import { ExternalDependencies } from "../../helpers/types.js";
import { ChannelIDsSettings, CommandSettings, ServerSettings, ServerSettingsParameters } from "../../helpers/pb/types.js";
import { RecordService } from "pocketbase";
import { findThroughCollection } from "../../helpers/pb/pb.js";

export const name = "set";
export const cooldown = 5;
export const description = "Settings for server owners or moderators to set."
export async function execute(
    client: Client,
    msg: Message,
    args: string[],
    ext: ExternalDependencies
) {
    if (msg.channel.type !== ChannelType.GuildText)
        return;
    if (!msg.member?.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
        msg.reply(`You would need to have a \`Manage Guild\` permission to edit or create the settings.`);
        return;
    }

    const selector = args.at(0);

    const settings = ext.pb.collection("server_settings");
    const command_scopes = ext.pb.collection("command_scopes");
    const channel_ids = ext.pb.collection("channel_ids");

    const server_setting = await findThroughCollection<ServerSettings>(settings, "serverid", msg.channel.guildId);

    if (!server_setting) { // init
        const re = await msg.reply(`Creating default settings.`);
        const def = await initializeSettings(settings, msg.channel.guild.id);
        await re.edit(`Created settings on ${def.serverid} with \`nsfw: ${def.nsfw}\`, \`prefix: ${def.prefix}\`, \`self_quote: ${def.self_quote}\``)
        return;
    }

    if (!selector) {
        msg.reply(`Select a selector like so: \`??set [prefix] [?? or !! or whatever]\``);
        return;
    }

    // ??set prefix [prefix: string]
    if (selector === "prefix") {
        const set_prefix = args.at(1);
        const reply = await handlePrefixSettings(settings, server_setting.id, set_prefix);
        msg.reply(reply);
        return;
    }

    // ??set ping [channel_id] [true/false]
    const command = ext.commands.get(selector);
    if (!command)
        return;

    const channel_id = args.at(1);
    const isEnabled = args.at(2);
    if (!(channel_id && isEnabled)) {
        msg.reply(`\`??set [command_name] [channel_id] [true/false]\``);
        return;
    }

    // Finding the command scopes
    const isMatching = await checkMatchingServerChannelIDs(client, channel_id, msg.channel.guild.id)
    if (!isMatching) {
        msg.reply("Non-matching channelIDs and serverIDs, cheeky ain't ya?");
        return;
    }

    // if the channel id already exists in the channel_id collection
    const channel = await findThroughCollection<ChannelIDsSettings>(channel_ids, "channel_id", channel_id)
    if (channel) {
        const channel_record = await channel_ids.getOne<ChannelIDsSettings<CommandSettings>>(channel.id, { expand: "command_scope" });
        const scope = await command_scopes.update(channel_record.expand.command_scope.id, {
            [command.name]: isEnabled.toLowerCase() === "true"
        });
        msg.reply(formatScope(scope));
    } else {
        const scope = await command_scopes.create<CommandSettings>({
            [command.name]: isEnabled.toLowerCase() === "true"
        });
        const channel_id_record = await channel_ids.create<ChannelIDsSettings>({
            channel_id: channel_id,
            command_scope: scope.id,
        });
        await settings.update(server_setting.id, {
            "channel_ids+": channel_id_record.id
        })
        msg.reply(formatScope(scope));
    }
}

async function handlePrefixSettings(
    settings: RecordService,
    id: string,
    set_prefix: string | undefined,
) {
    if (set_prefix && set_prefix.length !== 0) {
        const data: ServerSettingsParameters = {
            prefix: set_prefix
        };
        const selected_setting = await settings.update<ServerSettings>(id, data);
        return `Prefix updated: \`${selected_setting.prefix}\``;
    } else {
        return "You did not give a prefix.";
    }
}

async function initializeSettings(settings: RecordService, guildID: string) {
    const default_settings: ServerSettingsParameters = {
        serverid: guildID,
        nsfw: false,
        self_quote: true,
    };
    return await settings.create<ServerSettings>(default_settings);
}

function formatScope(scope: CommandSettings) {
    let beginning = "Activated: ";
    Object.entries(scope).forEach(v => {
        if (v[1] === true)
            beginning += `${v[0]}, `;
    });
    return beginning;
}

async function checkMatchingServerChannelIDs(client: Client, channel_id: string, server_id: string) {
    const guild = client.guilds.cache.get(server_id) ?? await client.guilds.fetch(server_id);
    const channel = guild.channels.cache.get(channel_id);
    return channel ? true : false;
}