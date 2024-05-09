import { readFile } from "node:fs/promises";

interface Config {
    auditLogChannelID: string;
    baseURL: string;
    blacklistedTags: Array<string>;
    cdnHost: string;
    discord: {
        id: string;
        secret: string;
        token: string;
    };
    encryptionKey: string;
    encryptionSalt: string;
    eventChannelID: string;
    guildID: string;
    joinerChannelID: string;
    joinerPort: number;
    joinerSecret: string;
    joinerURL: string;
    redis: string;
    redisChannels: {
        tickets: string;
    };
    roles: {
        admin: string;
    };
    safeChannels: Array<string>;
    staffCategories: Array<string>;
    ticketChannelID: string;
}

const file = process.env.CONFIG_FILE || new URL(import.meta.url.endsWith(".ts") ? "../config.json" : "../../config.json", import.meta.url).pathname;
const config = await readFile(file, "utf8").then(JSON.parse) as Config;
export default config;
