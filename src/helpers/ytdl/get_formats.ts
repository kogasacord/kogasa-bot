import fetch from "node-fetch";
import { FormatResponse } from "./types";

import settings from "../../../settings.json" assert { type: "json" };

export async function getFormats(request: string) {
	const info = await fetch(`${settings.ytdl_endpoint}/format`, {
		method: "POST",
		body: JSON.stringify({
			link: request,
		}),
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
	});
	return (await info.json()) as FormatResponse;
}
