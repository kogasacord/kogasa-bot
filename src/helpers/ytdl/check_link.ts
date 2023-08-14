import fetch from "node-fetch";
import { CheckResult } from "./types";

export async function checkLink(link: string) {
    const check = await fetch("http://localhost:3000/checklink", {
        method: "POST",
        body: JSON.stringify({ link: link }),
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    });
    return await check.json() as CheckResult;
}