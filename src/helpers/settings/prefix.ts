import Pocketbase from "pocketbase";
import { ServerSettings } from "../pb/types.js";

export async function prefixChange(
    pb: Pocketbase,
    test: boolean,
    guildID: string
) {
    let prefix = test ? "!!" : "??";

    const server_settings = await pb
        .collection("server_settings")
        .getList<ServerSettings>(undefined, undefined, {
            filter: `serverid = "${guildID}"`
        });
    if (server_settings.items.length !== 0) {
        const server_prefix = server_settings.items[0].prefix;
        if (server_prefix)
            prefix = server_prefix;
    }
    return prefix;
}