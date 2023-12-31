import Pocketbase from "pocketbase";
import { findThroughCollection } from "@helpers/pb/pb.js";
import { ServerSettings } from "@helpers/pb/types.js";

export async function getServerPrefix(
	pb: Pocketbase,
	test: boolean,
	guildID: string
) {
	let prefix = test ? "!!" : "??";
	// findThroughCollection is an unoptimized mess.
	const server_settings = await findThroughCollection<ServerSettings>(
		pb.collection("server_settings"),
		"serverid",
		guildID
	);
	if (server_settings) {
		const server_prefix = server_settings.prefix;
		if (server_prefix) prefix = server_prefix;
	}
	return prefix;
}
