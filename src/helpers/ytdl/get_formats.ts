import fetch from "node-fetch"
import { FormatResponse } from "./types"

export async function getFormats(request: string) {
  const info = await fetch("http://localhost:3000/format", {
    method: "POST",
    body: JSON.stringify({
      link: request,
    }),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  })
  return (await info.json()) as FormatResponse
}
