import fetch from "node-fetch";
export async function quoteAttachment(text, author, avatar_url, attachment_url) {
    const check = await fetch("http://localhost:4000/quote/img", {
        method: "POST",
        body: JSON.stringify({
            text: text,
            author: author,
            avatar_url: avatar_url,
            attachment_url: attachment_url,
        }),
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    });
    return Buffer.from(await check.arrayBuffer());
}
