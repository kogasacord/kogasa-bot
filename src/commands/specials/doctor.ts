import { Client, Message } from "discord.js";
import { ExternalDependencies } from "../../helpers/types.js";
import { getInfo } from "../../helpers/ytdl/info.js";
import { quoteDefault } from "../../helpers/quote/default.js";

const YTDLURL = "http://localhost:3000/ping";
const CANVASURL = "http://localhost:4000/ping";
const LLAMAURL = "http://localhost:5000/ping";

export const name = "doctor";
export const cooldown = 20;
export const special = true;
export const description = "Send me to Eirin and let them check my health."
export async function execute(
    client: Client,
    msg: Message,
    args: string[],
    ext: ExternalDependencies,
) {
	const doctor_results = {
        ytdl:    false,
        canvas:  false,
        llama2b: false,
    }
	doctor_results.ytdl = await pingServer(YTDLURL);
	doctor_results.canvas = await pingServer(CANVASURL);
	doctor_results.llama2b = await pingServer(LLAMAURL);
    msg.reply(formatDiagnosis(doctor_results));
}

function formatDiagnosis(doctor: { [k: string]: boolean }) {
	const diagnosis: string[] = ["## Eirin's Diagnosis \n\n"];
	const servers = Object.entries(doctor);
	let hasDownServers: boolean = false;
	for (const server of servers) {
		diagnosis.push(`- ${server[0]}: ${server[1] ? "Up. :white_sun_small_cloud:" : "Down. :umbrella:"}`)
		if (server[1] === false && hasDownServers === false)
			hasDownServers = true;
	}
	if (hasDownServers)
		diagnosis.push("\nContact Alice.")
	return diagnosis.join("\n");
}

export async function pingServer(url: string) {
	try {
    	const server = await fetch(url, {
        	method: "GET",
        	headers: {
            	"Content-Type": "application/json",
            	"Accept": "application/json",
        	},
    	});
    	return await server.json() as boolean; // turn this into a boolean soon.
	} catch (err) {
		return false;
	}
}
