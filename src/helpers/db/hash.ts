
import { createHash } from "node:crypto";

export const HASH_LENGTH = 25;
export function hash(content: string, hash_length: number) {
	return createHash("sha256")
		.update(content)
		.digest("hex")
		.toString()
		.slice(0, hash_length);
}
