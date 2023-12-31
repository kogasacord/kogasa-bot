import fetch from "node-fetch";
import { InfoResponse } from "./types.js";

import settings from "@root/settings.json" assert { type: "json" };

export async function getInfo(request: string) {
	const info = await fetch(`${settings.ytdl_endpoint}/info`, {
		method: "POST",
		body: JSON.stringify({
			link: request,
		}),
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
	});
	return (await info.json()) as InfoResponse;
}
