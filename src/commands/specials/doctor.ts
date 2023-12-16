import { Client, Message } from "discord.js";
import helpers, { ExternalDependencies } from "../../helpers/helpers.js";

const YTDLURL = "http://localhost:3000/ping";
const CANVASURL = "http://localhost:4000/ping";
const LLAMAURL = "http://localhost:5000/ping";

let latency = await getAverageLatency("discord.com", 3);

setInterval(async () => {
  latency = await getAverageLatency("discord.com", 3);
}, 60 * 3000);

export const name = "doctor";
export const aliases = ["eirinhelpme"];
export const cooldown = 20;
export const special = true;
export const description = "Send me to Eirin and let them check my health.";
export async function execute(
  client: Client,
  msg: Message,
  args: string[],
  ext: ExternalDependencies
) {
  await msg.channel.sendTyping();
  const doctor_results = {
    ytdl: false,
    canvas: false,
    llama2b: false,
  };
  doctor_results.ytdl = await pingServer(YTDLURL);
  doctor_results.canvas = await pingServer(CANVASURL);
  doctor_results.llama2b = await pingServer(LLAMAURL);
  msg.reply(
    `## Eirin's Diagnosis\n\n` +
      `Latency to discord.com, refreshed every minute: \`${latency}ms\`. \n` +
      `Commands imported: \`${[...ext.commands.entries()].length}\`\n` +
      `${formatDiagnosis(doctor_results)}`
  );
}

function formatDiagnosis(doctor: { [k: string]: boolean }) {
  const diagnosis: string[] = [];
  const servers = Object.entries(doctor);
  let hasDownServers: boolean = false;
  for (const server of servers) {
    diagnosis.push(
      `- ${server[0]}: ${
        server[1] ? "Up. :white_sun_small_cloud:" : "Down. :umbrella:"
      }`
    );
    if (server[1] === false && hasDownServers === false) hasDownServers = true;
  }
  if (hasDownServers) diagnosis.push("\nContact Alice.");
  return diagnosis.join("\n");
}

async function getAverageLatency(url: string, ping_count: number) {
  const pings = await helpers.pingURL(url, ping_count);
  const average_latency = pings.map((c) => c.time);

  if (average_latency.length > 1)
    return average_latency.reduce((prev, curr) => prev + curr) / pings.length;
  return average_latency;
}

export async function pingServer(url: string) {
  try {
    const server = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    return (await server.json()) as boolean; // turn this into a boolean soon.
  } catch (err) {
    return false;
  }
}
