
import {spawn, ChildProcessWithoutNullStreams} from "child_process";

/**
	* An extremely light wrapper for child process spawning.
	*/
export class Process {
	private process: ChildProcessWithoutNullStreams;
	constructor(path: string) {
		try {
			this.process = spawn(path);
		} catch (error) {
			throw new Error(`Failed to spawn engine process: ${(error as Error).message}`);
		}
	}

	sendCommand(command: string): Promise<string> {
		return new Promise<string>((res, rej) => {
			this.process.stdin.write(command + "\n");
			this.process.stdout.once("data", data => {
				const response: string = data.toString();
				res(response);
			});
			this.process.stdout.once("error", rej);
		});
	}
}
