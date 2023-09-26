import fs from "fs";
import readline from "readline";
import chalk from "chalk";
import { getRandomInt } from "../helpers/misc/random.js";
import { Client, Message } from "discord.js";

type JSONObject = { [a: string]: any }
type Tier = {
    chance: number,
    name: string,
    emote: string
} & JSONObject

// by percentage to 100%
const tiers = new Map<string, Tier>([
    ["C", { chance: 40, name: "Common", emote: ":cd:" }], // implement low_chance and high_chance to compare together
    ["UC", { chance: 70, name: "Uncommon", emote: ":comet:" }],
    ["R", { chance: 90, name: "Rare", emote: ":sparkles:" }],
    ["SR", { chance: 100, name: "Super Rare", emote: ":sparkles::camping:" }]
])

const websites = await grabAllRandomWebsites("./media/randomweb.jsonl") // this is not safe.

export const name = "randomweb";
export const cooldown = 30;
export const description = "Sends a random website to you, scaled by rarity. The more rare it is, the more obscure (or goofy) the website is. Goes from Common to Super Rare."
export async function execute(client: Client, msg: Message, args: string[]) {
    const gacha = gachaSpecificWebsite(websites, tiers);
    if (gacha) {
        msg.reply(`${gacha.rarity_emote} <${gacha.website.site}> (${gacha.website.rarity} | ${gacha.rarity_name})`)
    } else {
        msg.reply(
            `I have no idea what happened to the random number generator if this message shows up.` + 
            `\nWebsite list length: ${websites.length}`
        )
    }
}

function gachaSpecificWebsite(
    websites: { rarity: string, site: string }[],
    chances: Map<string, Tier>
) {
    const rannum = getRandomInt(1, 100);
    
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

function grabAllRandomWebsites(path: string) {
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