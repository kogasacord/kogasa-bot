import fetch from "node-fetch";
import { InfoResponse } from "./types";

export async function getInfo(request: string) {
	const info = await fetch("http://localhost:3000/info", {
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
