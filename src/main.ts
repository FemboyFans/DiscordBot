import "dotenv/config.js";
import DiscordBot from "./client.js";
import "./joiner/server.js";

const bot = new DiscordBot();
void bot.connect();
