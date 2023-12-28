import fetch from "node-fetch";

import settings from "@settings" assert { type: "json" };
// scripts to run on startup
export async function enableAutoDelete() {
	await fetch(`${settings.ytdl_endpoint}/enableAutoDeletion`, {
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
