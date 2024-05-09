import ClientEvent from "../util/ClientEvent.js";
import config from "../config.js";
import { getAll } from "../joiner/discordLink.js";
import { addPhrase, getAllPhrases, getPhrasesFor, removePhrase } from "../phrases.js";
import { idToName, normalizeName } from "../util/util.js";
import Logger from "@uwu-codes/logger";
import {
    MessageFlags,
    User,
    type AllowedMentions,
    type AnyInteractionChannel,
    type ApplicationCommandTypes,
    type CommandInteraction,
    type Uncached
} from "oceanic.js";

export default new ClientEvent("interactionCreate", async function(interaction) {
    if (interaction.isCommandInteraction()) {
        if (interaction.isChatInputCommand()) {
            switch (interaction.data.name) {
                case "phrases": return phrasesCommand(interaction);
                case "whois": return whoisCommand(interaction);
                case "sync": return syncCommand(interaction);
            }
        } else {
            switch (interaction.data.name) {
                case "Whois": return whoisCommand(interaction);
            }
        }
    }
});

type ChatInputApplicationCommandInteraction =  CommandInteraction<AnyInteractionChannel | Uncached, ApplicationCommandTypes.CHAT_INPUT>;

async function phrasesCommand(interaction: ChatInputApplicationCommandInteraction) {
    const [subcommand, subcommandGroup] = interaction.data.options.getSubCommand(true);

    switch (subcommand) {
        case "role": {
            const role = Object.entries(config.roles).find(([name]) => name === interaction.data.options.getString("role", true))?.[1];
            if (role === undefined) {
                return interaction.reply({ content: "I couldn't find that role." });
            }
            switch (subcommandGroup) {
                case "add": {
                    const phrase = interaction.data.options.getString("phrase", true);
                    return addPhraseCommand(interaction, `&${role}`, phrase);
                }

                case "remove": {
                    const phrase = interaction.data.options.getString("phrase", true);
                    return removePhraseCommand(interaction, `&${role}`, phrase);
                }

                case "list": {
                    return dumpPhrasesCommand(interaction, `&${role}`);
                }
            }
            break;
        }

        case "personal": {
            switch (subcommandGroup) {
                case "add": {
                    const phrase = interaction.data.options.getString("phrase", true);
                    return addPhraseCommand(interaction, interaction.user.id, phrase);
                }

                case "remove": {
                    const phrase = interaction.data.options.getString("phrase", true);
                    return removePhraseCommand(interaction, interaction.user.id, phrase);
                }

                case "list": {
                    return dumpPhrasesCommand(interaction, interaction.user.id);
                }
            }
            break;
        }

        case "dump": {
            return dumpPhrasesCommand(interaction);
        }
    }
}

async function addPhraseCommand(interaction: ChatInputApplicationCommandInteraction, mention: string, phrase: string) {
    await addPhrase(mention, phrase);
    const role = (mention.startsWith("&") && Object.entries(config.roles).find(([,id]) => id === mention.slice(1))?.[0]) || null;
    if (role) {
        return interaction.reply({ content: `The phrase "${phrase}" has been added to the ${role.replaceAll("_", " ")} notification list.` });
    } else {
        return interaction.reply({ content: `The phrase "${phrase}" has been added to your notification list.` });
    }
}

async function removePhraseCommand(interaction: ChatInputApplicationCommandInteraction, mention: string, phrase: string) {
    await removePhrase(mention, phrase);
    const role = (mention.startsWith("&") && Object.entries(config.roles).find(([,id]) => id === mention.slice(1))?.[0]) || null;
    if (role) {
        return interaction.reply({ content: `The phrase "${phrase}" has been removed from the ${role.replaceAll("_", " ")} notification list.` });
    } else {
        return interaction.reply({ content: `The phrase "${phrase}" has been removed from your notification list.` });
    }
}

async function dumpPhrasesCommand(interaction: ChatInputApplicationCommandInteraction, target?: string) {
    const phrases = target === undefined ? await getAllPhrases() : await getPhrasesFor(target);
    const texts: Array<string> = [];
    let text = "";
    for (const [mention, values] of Object.entries(phrases)) {
        for (const value of values) {
            const t = `<@${mention}>: ${value}`;
            if (t.length + text.length < 1950) {
                text += `${t}\n`;
            } else {
                texts.push(text);
                text = `${t}\n`;
            }
        }
    }

    if (text.length !== 0) {
        texts.push(text);
    }

    const first = texts.shift();
    if (first === undefined) {
        await interaction.reply({ content: "No phrases are registered." });
        return;
    }
    const allowedMentions: AllowedMentions = { users: [], roles: [] };
    await interaction.reply({ content: `The following phrases are registered:\n${first}`, allowedMentions });
    for (const content of texts) {
        await interaction.reply({ content, allowedMentions });
    }
}

async function whoisCommand(interaction: CommandInteraction) {
    let id: string | number;
    // the getAll function expects a number if we're starting from a user id, and a string if we're starting
    // from a Discord id. There aren't any Discord accounts with an id shorter than 17 characters
    if (interaction.isChatInputCommand()) {
        id = interaction.data.options.getString("user", true).replace(/<@!?/, "").replace(">", "");
    } else {
        if (!(interaction.data.target instanceof User)) {
            return interaction.reply({
                content: "Invalid user.",
                flags:   MessageFlags.EPHEMERAL
            });
        }
        id = interaction.data.target.id;
    }

    if (id.length < 17) {
        id =  Number(id);
    }
    const { discord, user } = await getAll(id);
    const userNames = await idToName(...user);

    if (discord.length === 0 && user.length === 0) {
        return interaction.reply({
            content: "I couldn't find anyone with that ID."
        });
    }

    let text: string;
    if (typeof id === "number") {
        text = `[${userNames[id]}](${config.baseURL}/users/${id})<${id}>'s site and discord accounts:\n`;
    } else {
        text = `<@${id}>'s site and discord accounts:\n`;
    }

    for (const uid of user) {
        text += `• ${config.baseURL}/users/${uid} (\`${userNames[uid]}\`)\n`;
    }

    for (const did of discord) {
        text += `•• <@${did}>\n`;
    }

    return interaction.reply({
        content:         text,
        allowedMentions: {
            everyone:    false,
            repliedUser: false,
            roles:       false,
            users:       false
        }
    });
}

async function syncCommand(interaction: CommandInteraction) {
    let user_id = interaction.data.options.getNumber("user_id");

    const { user } = await getAll(interaction.user.id);
    const names = await idToName(...user);
    user_id ??= user[0];

    if (!user_id || !user.includes(user_id)) {
        return interaction.reply({
            content: "I couldn't find that user.",
            flags:   MessageFlags.EPHEMERAL
        });
    }

    return interaction.client.rest.guilds.editMember(config.guildID, interaction.user.id, { nick: normalizeName(names[user_id]) })
        .then(() => interaction.reply({
            content: "Your name has been synced.",
            flags:   MessageFlags.EPHEMERAL
        })).catch(err => {
            Logger.getLogger("SyncCommand").error(err);
            return interaction.reply({
                content: "There was an error syncing your name.",
                flags:   MessageFlags.EPHEMERAL
            });
        });
}
