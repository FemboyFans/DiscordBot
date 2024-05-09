import Redis from "../Redis.js";

// FIXME: this is inefficient and tries to add the same user id & discord id multiple times
export async function addUser(userID: number, discordID: string, seen = new Set<string>()) {
    if (seen.has(discordID)) {
        return;
    }
    seen.add(discordID);

    const existing = await Redis.smembers(`site-to-discord:${userID}`);

    await Redis.sadd(`site-to-discord:${userID}`, discordID);

    for (const discord of existing) {
        await Redis.sadd(`discord-to-site:${discord}`, userID);
        await addUser(userID, discord, seen);
    }

    await Redis.sadd(`discord-to-site:${discordID}`, userID);
}

// FIXME: this code is inefficient, the initial ID is fetched 3 times, and every other id is fetched twice
export async function getAll(id: string | number, seen = new Set<string>()): Promise<{ discord: Array<string>; user: Array<number>; }> {
    const sid = String(id);
    if (seen.has(sid)) {
        return { discord: [], user: [] };
    }
    seen.add(sid);


    const allUser: Array<number> = [], allDiscord: Array<string> = [];
    if (typeof id === "number") {
        // user id
        const discordIDs = await Redis.smembers(`site-to-discord:${id}`);

        for (const discord of discordIDs) {
            const userIDs = await Redis.smembers(`discord-to-site:${discord}`);
            allDiscord.push(discord);
            const nestedDiscord = await getAll(discord, seen);
            allUser.push(...nestedDiscord.user);
            allDiscord.push(...nestedDiscord.discord);

            for (const user of userIDs) {
                const nestedUser = await getAll(Number(user), seen);
                allUser.push(...nestedUser.user);
                allDiscord.push(...nestedUser.discord);
            }
        }
    } else {
        // discord id
        const userIDs = await Redis.smembers(`discord-to-site:${id}`);

        for (const user of userIDs) {
            const discordIDs = await Redis.smembers(`site-to-discord:${user}`);
            allUser.push(Number(user));
            const nestedUser = await getAll(Number(user), seen);
            allUser.push(...nestedUser.user);
            allDiscord.push(...nestedUser.discord);

            for (const discord of discordIDs) {
                const nestedDiscord = await getAll(discord, seen);
                allUser.push(...nestedDiscord.user);
                allDiscord.push(...nestedDiscord.discord);
            }
        }
    }

    return { discord: Array.from(new Set(allDiscord)), user: Array.from(new Set(allUser)) };
}
