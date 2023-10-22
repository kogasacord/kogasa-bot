import { findThroughCollection } from "../pb/pb.js";
export async function prefixChange(pb, test, guildID) {
    let prefix = test ? "!!" : "??";
    const server_settings = await findThroughCollection(pb.collection("server_settings"), "serverid", guildID);
    if (server_settings) {
        const server_prefix = server_settings.prefix;
        if (server_prefix)
            prefix = server_prefix;
    }
    return prefix;
}
