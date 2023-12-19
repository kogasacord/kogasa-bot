import fetch from "node-fetch";
import { InfoResponse } from "./types";

import {ytdl_endpoint} from "../../../settings.json";

export async function getInfo(request: string) {
	const info = await fetch(`${ytdl_endpoint}/info`, {
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
