import fetch from "node-fetch";
import { CheckResult } from "./types";

import settings from "@settings" assert { type: "json" };

export async function checkLink(link: string, format_id?: string) {
	const check = await fetch(`${settings.ytdl_endpoint}/checklink`, {
		method: "POST",
		body: JSON.stringify({ link: link, format_id: format_id }),
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
	});
	return (await check.json()) as CheckResult;
}
