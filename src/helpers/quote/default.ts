import fetch from "node-fetch";

import settings from "@root/settings.json" assert { type: "json" };

export async function quoteDefault(
	text: string,
	author: string,
	avatar_url: string,
	show_boundaries: boolean
) {
	const check = await fetch(`${settings.quote_endpoint}/quote`, {
		method: "POST",
		body: JSON.stringify({
			text: text,
			author: author,
			avatar_url: avatar_url,
			pipe_to_file: false,
			show_bounding: show_boundaries,
			use_test_pfp: false,
		}),
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
	});
	return Buffer.from(await check.arrayBuffer());
}
