import Pocketbase from "pocketbase";
import { findThroughCollection } from "../pb/pb.js";
import { ChannelIDsSettings, CommandSettings, ServerSettings } from "../pb/types.js";

export async function commandChannelAccess(
    pb: Pocketbase,
    command_name: string,
    channel_id: string,
    guild_id: string,
) {
    const server_record = await findThroughCollection<ServerSettings>(pb.collection("server_settings"), "serverid", guild_id);
    const channel_record = await findThroughCollection<ChannelIDsSettings>(pb.collection("channel_ids"), "channel_id", channel_id);

    if (server_record) {

        if (!channel_record) {
            return `The command is not allowed here.`;
        }

        const scopes = pb.collection("command_scopes");
        const scope = await scopes.getOne<CommandSettings>(channel_record.command_scope);
        const map = new Map<string, boolean>(Object.entries(scope)); // types aren't exactly right..! it works for now.
        if (!map.get(command_name)) {
            return "Command cannot be accessed here.";
        }
    }
}
