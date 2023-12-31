import Pocketbase from "pocketbase";
import { findThroughCollection } from "@helpers/pb/pb.js";
import {
	ChannelIDsSettings,
	CommandSettings,
	ServerSettings,
} from "@helpers/pb/types.js";

/*
 * checks if a command is allowed in scopes | false = not allowed, true = allowed
 */
export async function hasCommandChannelAccess(
	pb: Pocketbase,
	command_name: string,
	channel_id: string,
	guild_id: string
): Promise<boolean> {
	const server_record = await findThroughCollection<ServerSettings>(
		pb.collection("server_settings"),
		"serverid",
		guild_id
	);
	const channel_record = await findThroughCollection<ChannelIDsSettings>(
		pb.collection("channel_ids"),
		"channel_id",
		channel_id
	);

	return (
		!server_record ||
		(!!channel_record &&
			(await checkIfCommandIsAllowed(pb, channel_record, command_name)))
	);
}

async function checkIfCommandIsAllowed(
	pb: Pocketbase,
	channel_record: ChannelIDsSettings,
	command_name: string
) {
	const scopes = pb.collection("command_scopes");
	const command_scope = await scopes.getOne<CommandSettings>(
		channel_record.command_scope
	);
	const command_scope_items = new Map<string, boolean>(
		Object.entries(command_scope)
	); // types aren't exactly right..! it works for now.
	const is_command_allowed = command_scope_items.get(command_name) ?? false;
	return is_command_allowed;
}
