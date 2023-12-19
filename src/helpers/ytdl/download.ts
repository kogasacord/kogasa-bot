import fetch from "node-fetch";
import { DownloadResponse } from "./types";

import {ytdl_endpoint} from "../../../settings.json";

export async function downloadVideo(request: string, format_id?: string) {
	const download = await fetch(`${ytdl_endpoint}/download`, {
		method: "POST",
		body: JSON.stringify({
			link: request,
			format_id: format_id,
		}),
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
	});
	return (await download.json()) as DownloadResponse;
}
