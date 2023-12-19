import fetch from "node-fetch";
import { FormatResponse } from "./types";

import {ytdl_endpoint} from "../../../settings.json";

export async function getFormats(request: string) {
	const info = await fetch(`${ytdl_endpoint}/format`, {
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
