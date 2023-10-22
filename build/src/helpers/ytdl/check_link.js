import fetch from "node-fetch";
export async function checkLink(link, format_id) {
    const check = await fetch("http://localhost:3000/checklink", {
        method: "POST",
        body: JSON.stringify({ link: link, format_id: format_id }),
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    });
    return await check.json();
}
