import fetch from "node-fetch";
import { UploadResponse } from "./types";

import settings from "../../../settings.json" assert { type: "json" };

export async function uploadVideo(filename: string, mimetype: string) {
	const upload = await fetch(`${settings.ytdl_endpoint}/upload`, {
		method: "POST",
		body: JSON.stringify({
			filename: filename,
			mimetype: mimetype,
		}),
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
	});
	return (await upload.json()) as UploadResponse;
}
