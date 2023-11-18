import fs from "fs";
import readline from "readline";
import seedrandom from "seedrandom";
import random from "random";
import crypto from "crypto";
import { Tier, Website } from "../types";

const seed = crypto.randomBytes(400).toString();
const rng = random.clone(seedrandom(seed, { entropy: true }))
/*
	* min: inclusive, max: inclusive
	*
	* Inpure function.
	*/
export function getRandomInt(min: number, max: number) {
	return rng.uniformInt(min, max)();
}

export function pickRandom<T>(iterable: T[]): T {
	return iterable[getRandomInt(0, iterable.length)];
}

export function grabAllRandomWebsites(path: string): Promise<Website[]> {
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

export function gachaSpecificWebsite(
    websites: Website[],
    chances: Map<string, Tier>
) {
    const rannum = getRandomInt(1, 300);
    
    for (const rarity_name of chances.keys()) {
        const rarity_value = chances.get(rarity_name);

        if (!rarity_value) {
            throw Error("Something went wrong with grabbing rarity from the \"Tiers\" Hashmap.");
        }
        if (rannum <= rarity_value.chance) {
            const rarity_websites = websites.filter((v) => v.rarity === rarity_name);
            return {
                website: rarity_websites[getRandomInt(0, rarity_websites.length - 1)],
                rarity_name: rarity_value.name,
                rarity_emote: rarity_value.emote,
                diceroll: rannum
            }
        }
    }
}

