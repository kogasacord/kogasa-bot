import fetch from "node-fetch";

import {ytdl_endpoint} from "../settings.json";
// scripts to run on startup
export async function enableAutoDelete() {
	await fetch(`${ytdl_endpoint}/enableAutoDeletion`, {
		method: "POST",
		body: JSON.stringify({
			minutes: 15,
		}),
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
	});
	console.log("Enabled autoDelete for googledrive.");
}
