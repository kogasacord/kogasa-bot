import { Client, Message } from "discord.js";
import { ExternalDependencies, Tier, Websites } from "../helpers/types";

export const name = "randomwebinfo";
export const cooldown = 15;
export const description = "Information about randomweb. It will come with tracking your collected websites soon."
export async function execute(client: Client, msg: Message, args: string[], external_data: ExternalDependencies) {
    const websites: Websites = external_data.external_data[0];
    const tiers: Map<string, Tier> = external_data.external_data[1];

    msg.reply(
        `\`\`\``
        + `C Websites count: ${websites.filter(v => v.rarity === "C").length} | ${100 - tiers.get("C")!.chance} out of 100\n`
        + `UC Websites count: ${websites.filter(v => v.rarity === "UC").length} | ${tiers.get("UC")!.chance - tiers.get("C")!.chance} out of 100\n`
        + `R Websites count: ${websites.filter(v => v.rarity === "R").length}  | ${tiers.get("R")!.chance - tiers.get("UC")!.chance} out of 100\n`
        + `SR Websites count: ${websites.filter(v => v.rarity === "SR").length} | ${tiers.get("SR")!.chance - tiers.get("R")!.chance} out of 100\n`
        + `\`\`\``
        + `Visualization of chances: <https://www.desmos.com/calculator/veqgifgo8z>`
    )
}