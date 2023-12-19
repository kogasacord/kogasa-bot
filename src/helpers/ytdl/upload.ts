import fetch from "node-fetch";
import { UploadResponse } from "./types";

import {ytdl_endpoint} from "../../../settings.json";

export async function uploadVideo(filename: string, mimetype: string) {
	const upload = await fetch(`${ytdl_endpoint}/upload`, {
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
