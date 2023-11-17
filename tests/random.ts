import path from "path";
import url from "url";
import helpers, { Tier } from "../src/helpers/helpers.js";
import {Website} from "../src/helpers/types.js";

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const websites = await helpers.grabAllRandomWebsites(path.join("../media/randomweb.jsonl"))
const tiers = new Map<string, Tier>([
	["C", {chance: 137, name: "Common", emote: ":cd:"}], // implement low_chance and high_chance to compare together
	["UC", {chance: 220, name: "Uncommon", emote: ":comet:"}],
	["R", {chance: 275, name: "Rare", emote: ":sparkles:"}],
	["SR", {chance: 298, name: "Super Rare", emote: ":sparkles::camping:"}],
	["Q", {chance: 300, name: "Flower", emote: ":white_flower:"}]
]);

export function gacha(websites: Website[], tiers: Map<string, Tier>) {
	const count = new Map<string, number>();
	for (let i = 0; i < 5000; i++) {
		const a = helpers.gachaSpecificWebsite(websites, tiers);
		if (tiers.get(a!.website.rarity)) {
			if (count.get(a!.website.rarity)) {
				count.set(a!.website.rarity, count.get(a!.website.rarity)! + 1);
			} else {
				count.set(a!.website.rarity, 1)
			}
		}
	}
	return count;
}

console.log(gacha(websites, tiers))
console.log("Tested 5000 times")
