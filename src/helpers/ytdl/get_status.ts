import fetch from "node-fetch";
import { StatusResult } from "./types.js";

import settings from "@root/settings.json" assert { type: "json" };

export async function getStatus() {
	const status = await fetch(`${settings.ytdl_endpoint}/status`, {
		method: "GET",
	});
	return (await status.json()) as StatusResult;
}
