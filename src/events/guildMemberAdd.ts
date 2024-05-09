import ClientEvent from "../util/ClientEvent.js";
import config from "../config.js";
import { getAll } from "../joiner/discordLink.js";
import { idToName } from "../util/util.js";

export default new ClientEvent("guildMemberAdd", async function(member) {
    if (member.guildID !== config.guildID) {
        return;
    }

    const { discord, user } = await getAll(member.id);
    const userNames = await idToName(...user);

    let text = `${member.mention}'s site and discord accounts:\n`;

    for (const uid of user) {
        text += `• ${config.baseURL}/users/${uid} (\`${userNames[uid]}\`)\n`;
    }

    for (const did of discord) {
        text += `•• <@${did}>\n`;
    }

    await member.client.rest.channels.createMessage(config.joinerChannelID, {
        content:         text,
        allowedMentions: {
            everyone:    false,
            repliedUser: false,
            roles:       false,
            users:       false
        }
    });
});
