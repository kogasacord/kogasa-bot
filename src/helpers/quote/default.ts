import fetch from "node-fetch"

export async function quoteDefault(
  text: string,
  author: string,
  avatar_url: string
) {
  const check = await fetch("http://localhost:4000/quote", {
    method: "POST",
    body: JSON.stringify({
      text: text,
      author: author,
      avatar_url: avatar_url,
    }),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  })
  return Buffer.from(await check.arrayBuffer())
}
