import fs from "fs";
import readline from "readline";
import seedrandom from "seedrandom";
import random from "random";
import crypto from "crypto";

const seed = crypto.randomBytes(400).toString();
const rng = random.clone(seedrandom(seed, { entropy: true }))
/*
	* min: inclusive, max: inclusive
	*
	* Inpure function.
	*/
export function getRandomInt(min: number, max: number) {
	return rng.uniformInt(0, 100)();
}

export function grabAllRandomWebsites(path: string) {
    return new Promise<{ rarity: string, site: string }[]>((res, rej) => {
        const sites: { rarity: string, site: string }[] = []
        const readInterface = readline.createInterface({
            input: fs.createReadStream(path),
        });
        readInterface.on('line', (input) => {
            sites.push(JSON.parse(input))
        });
        readInterface.on('close', () => { res(sites) });
    })
}
