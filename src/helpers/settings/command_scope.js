import { findThroughCollection } from "../pb/pb.js";
export async function commandChannelAccess(pb, command_name, channel_id, guild_id) {
    const server_record = await findThroughCollection(pb.collection("server_settings"), "serverid", guild_id);
    const channel_record = await findThroughCollection(pb.collection("channel_ids"), "channel_id", channel_id);
    if (server_record) {
        if (!channel_record) {
            return `The command is not allowed here.`;
        }
        const scopes = pb.collection("command_scopes");
        const scope = await scopes.getOne(channel_record.command_scope);
        const map = new Map(Object.entries(scope)); // types aren't exactly right..! it works for now.
        if (!map.get(command_name)) {
            return "Command cannot be accessed here.";
        }
    }
}
