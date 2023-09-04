import { RecordService } from "pocketbase";
import { findThroughCollection } from "../../helpers/pb/pb.js";
import { ServerSettings, ServerSettingsParameters } from "../../helpers/pb/types.js";
import { ExternalDependencies } from "../../helpers/types.js";
import { ChannelType, Client, Message, PermissionsBitField } from "discord.js";

export const name = "prefix";
export const cooldown = 5;
export const description = "Change the prefix server wide."
export const noscope = true;
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

    const prefix = args.at(0);
    const settings = ext.pb.collection("server_settings");
    const server_setting = await findThroughCollection<ServerSettings>(settings, "serverid", msg.channel.guildId);

    if (!server_setting) {
        msg.reply(`Please set up the server using \`??set\` without any arguments.`);
        return;
    }

    const reply = await handlePrefixSettings(settings, server_setting.id, prefix);
    msg.reply(reply);
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