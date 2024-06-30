import child_process from "child_process";
import os from "os";

interface Ping {
	bytes: number;
	time: number;
	TTL?: number;
	ttl?: number;
}
/*
 * This function requires admin privileges for Windows.
 */
export function pingURL(url: string, ping_count: number = 3) {
	return new Promise<Ping[]>((res, rej) => {
		const pings: Ping[] = [];

		// spawns the child_process/terminal
		// 		with the command e.g: "ping -n 3 google.com"
		const proc = child_process.spawn("ping", [
			optionforOS(),
			`${ping_count}`,
			url,
		]);

		// gets the outputs/printed data from the terminal
		proc.stdout.on("data", (chunk: Buffer) => {
			// Gets the "bytes=32 time=11ms TTL=114" from:
			// 		"Reply from 142.251.220.206: bytes=32 time=11ms TTL=114"
			const reply_info = [...chunk.toString().matchAll(/\w+=\d+/g)];
			if (reply_info.length < 3) {
				return;
			}

			const ping: Map<string, number> = new Map();

			for (const [category] of reply_info) {
				const [name, ms] = category.split("=");
				if (name && ms) {
					ping.set(name, parseInt(ms));
				}
			}

			// shut up.
			pings.push(Object.fromEntries(ping) as unknown as Ping);
		});
		proc.on("error", (err) => {
			rej(err);
		});
		proc.on("exit", () => {
			res(pings);
		});
	});
}

function optionforOS() {
	const OS = os.type() as "Windows_NT" | "Linux" | "Darwin";
	if (OS === "Windows_NT") return "-n";
	if (OS === "Linux") return "-c";
	throw Error("Unimplemented OS for ping.");
}
