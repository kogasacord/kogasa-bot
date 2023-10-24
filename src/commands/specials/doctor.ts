import { Client, Message } from "discord.js";
import { ExternalDependencies } from "../../helpers/types.js";
import { getInfo } from "../../helpers/ytdl/info.js";
import { quoteDefault } from "../../helpers/quote/default.js";

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
	doctor_results.ytdl = await pingYTDL();
	doctor_results.canvas = await pingCanvas();
	doctor_results.llama2b = await pingLlama2B();
    msg.reply(formatDiagnosis(doctor_results));
}

function formatDiagnosis(doctor: { [k: string]: boolean }) {
	const diagnosis: string[] = ["## Eirin's Diagnosis \n\n"];
	const servers = Object.entries(doctor);
	let hasDownServers: boolean = false;
	for (const server of servers) {
		diagnosis.push(`- ${server[0]}: ${server[1] ? "Up. :white_sun_small_cloud:" : "Down. :umbrella:"}`)
		if (!hasDownServers)
			hasDownServers = server[1];
	}
	if (hasDownServers)
		diagnosis.push("\nContact Alice.")
	return diagnosis.join("\n");
}

export async function pingLlama2B() {
	try {
    	const llama = await fetch("http://localhost:5000/ping", {
        	method: "GET",
        	headers: {
            	"Content-Type": "application/json",
            	"Accept": "application/json",
        	},
    	});
    	return await llama.json() as boolean; // turn this into a boolean soon.
	} catch (err) {
		return false;
	}
}
export async function pingYTDL() {
	try {
    	const ytdl = await fetch("http://localhost:3000/ping", {
        	method: "GET",
        	headers: {
            	"Content-Type": "application/json",
            	"Accept": "application/json",
        	},
    	});
    	return await ytdl.json() as boolean;
	} catch (err) {
		return false;
	}
}
export async function pingCanvas() {
	try {
    	const c = await fetch("http://localhost:4000/ping", {
        	method: "GET",
        	headers: {
            	"Content-Type": "application/json",
            	"Accept": "application/json",
        	},
    	});
    	return await c.json() as boolean;
	} catch (err) {
		return false;
	}
}
// check the different HTTPS and commands
