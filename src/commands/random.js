import { getRandomInt } from "../helpers/misc/random.js";
// by percentage to 100%
// https://www.desmos.com/calculator/veqgifgo8z
export const name = "randomweb";
export const cooldown = 30;
export const description = "Sends a random website to you, scaled by rarity. The more rare it is, the more obscure (or goofy) the website is. Goes from Common to Super Rare.";
export async function execute(client, msg, args, external_data) {
    const websites = external_data.external_data[0];
    const tiers = external_data.external_data[1];
    const gacha = gachaSpecificWebsite(websites, tiers);
    if (gacha) {
        msg.reply(`:package: ||${gacha.rarity_emote} <${gacha.website.site}>|| (${gacha.website.rarity} | ${gacha.rarity_name}) ${gacha.rarity_name === "Flower" ? "You uncover something strange." : ""}`);
    }
    else {
        msg.reply(`I have no idea what happened to the random number generator if this message shows up.` +
            `\nWebsite list length: ${websites.length}`);
    }
}
function gachaSpecificWebsite(websites, chances) {
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
            };
        }
    }
}