import fetch from "node-fetch"

export async function quoteAttachment(
  text: string,
  author: string,
  avatar_url: string,
  attachment_url: string,
  height: number,
  width: number,
  mimetype: string
) {
  const check = await fetch("http://localhost:4000/quote/img", {
    method: "POST",
    body: JSON.stringify({
      text: text,
      author: author,
      avatar_url: avatar_url,
      attachment_url: attachment_url,
      attachment_height: height,
      attachment_width: width,
      mimetype: mimetype,
    }),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  })
  return Buffer.from(await check.arrayBuffer())
}
