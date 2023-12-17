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
		const proc = child_process.spawn("ping", [
			optionforOS(),
			`${ping_count}`,
			url,
		]);
		proc.stdout.on("data", (chunk: Buffer) => {
			const regex = [...chunk.toString().matchAll(/\w+=\d+/g)];
			if (regex.length < 3) {
				return;
			}

			const ping: Map<string, number> = new Map();
			for (const results of regex) {
				const split = results[0].split("=");
				if (split.length > 0) ping.set(split[0], parseInt(split[1]));
			}
			// eslint-disable-next-line
			pings.push(Object.fromEntries(ping) as any);
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
