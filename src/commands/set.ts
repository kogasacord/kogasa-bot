import { Client, Message, ChannelType, PermissionsBitField } from "discord.js";
import { ExternalDependencies } from "../helpers/types.js";
import { ServerSettings, ServerSettingsParameters, ServerSettingsResult } from "../helpers/pb/pb.js";
import { RecordService } from "pocketbase";

export const name = "set";
export const cooldown = 20;
export const description = "Settings for server owners or moderators to set."
export async function execute(
    client: Client, 
    msg:    Message, 
    args:   string[], 
    ext:    ExternalDependencies
) {
    if (msg.channel.type !== ChannelType.GuildText)
        return;
    if (!msg.member?.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
        msg.reply(`You would need to have a \`Manage Guild\` permission to edit or create the settings.`);
        return;
    }

    const selector   = args.at(0);
    const set_prefix = args.at(1);

    const settings = ext.pb.collection("server_settings");
    const server_settings = await settings.getList<ServerSettings>(undefined, undefined, {
        filter: `serverid = "${msg.guildId}"`
    })
    const server_setting = server_settings.items.at(0);

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

    if (selector === "prefix") {
        if (set_prefix && set_prefix.length !== 0) {
            const data: ServerSettingsParameters = {
                prefix: set_prefix
            };
            const selected_setting = await settings.update<ServerSettings>(server_setting.id, data);
            msg.reply(`Prefix updated: \`${selected_setting.prefix}\``);
        } else {
            msg.reply("You did not give a prefix.");
        }
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