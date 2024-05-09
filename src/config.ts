const env = <R extends boolean = false>(key: string, required?: R): R extends true ? string : string | undefined => {
    const v = process.env[key];
    if (!v && required) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return v as never;
};
const config = {
    discord: {
        token:  env("DISCORD_TOKEN", true),
        id:     env("DISCORD_ID", true),
        secret: env("DISCORD_SECRET", true)
    },
    redis:         env("REDIS_URL") || "redis://redis/1",
    redisChannels: {
        tickets: env("REDIS_CHANNEL_TICKETS") || "ticket_updates"
    },
    guildID: env("GUILD_ID", true),
    roles:   {
        admin: env("ADMIN_ROLE", true)
    },
    joinerPort:        Number(env("JOINER_PORT") || 3003),
    joinerURL:         env("JOINER_URL", true),
    joinerSecret:      env("JOINER_SECRET", true),
    joinerChannelID:   env("JOINER_CHANNEL_ID", true),
    auditLogChannelID: env("AUDIT_LOG_CHANNEL_ID", true),
    eventChannelID:    env("EVENT_CHANNEL_ID", true),
    ticketChannelID:   env("TICKET_CHANNEL_ID", true),
    baseURL:           env("BASE_URL", true),
    cdnHost:           env("CDN_HOST", true),
    blacklistedTags:   env("BLACKLISTED_TAGS")?.split(",") || [],
    staffCategories:   env("STAFF_CATEGORIES")?.split(",") || [],
    safeChannels:      env("SAFE_CHANNELS")?.split(",") || [],
    encryptionKey:     env("ENCRYPTION_KEY", true),
    encryptionSalt:    env("ENCRYPTION_SALT", true),
    viewsDir:          new URL(import.meta.url.endsWith(".ts") ? "../joiner/views" : "../../src/joiner/views", import.meta.url).pathname
};
export default config;
