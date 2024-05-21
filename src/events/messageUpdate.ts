import ClientEvent from "../util/ClientEvent.js";
import EncryptionHandler from "../util/EncryptionHandler.js";
import Redis from "../Redis.js";
import { handleLinks } from "../util/handleLinks.js";
import config from "../config.js";
import { EmbedBuilder } from "@oceanicjs/builders";
import type { JSONMessage } from "oceanic.js";

export default new ClientEvent("messageUpdate", async function(msg, oldMessage) {
    if (!msg.guildID || msg.author.id === this.user.id) {
        return;
    }

    if (!oldMessage) {
        const old = await Redis.get(`discord-messages:${msg.id}`);
        if (old) {
            oldMessage = JSON.parse(EncryptionHandler.decrypt(old)) as JSONMessage;
        }
    }

    await Redis.set(`discord-messages:${msg.id}`, EncryptionHandler.encrypt(JSON.stringify(msg.toJSON())));

    if (oldMessage) {
        if (msg.content === oldMessage.content && JSON.stringify(msg.attachments.toArray()) === JSON.stringify(oldMessage.attachments)) {
            return;
        }

        if (msg.inCachedGuildChannel()) {
            await handleLinks(msg);
        }

        const embed = new EmbedBuilder()
            .setTitle("Edited Message")
            .setColor(0xFFFF00)
            .setTimestamp(msg.createdAt)
            .addField("Channel", `<#${msg.channelID}>`, true)
            .addField("User", `<@${msg.author.id}>`, true)
            .addField("Message", msg.jumpLink, true);

        if (msg.content !== oldMessage.content) {
            embed.addField("Before", oldMessage.content.slice(0, 2000));
            embed.addField("After", msg.content.slice(0, 2000));
        }

        const addedAttachments = msg.attachments.toArray().filter(a => !oldMessage.attachments.some(att => att.id === a.id));
        const removedAttachments = oldMessage.attachments.filter(att => !msg.attachments.toArray().some(a => a.id === att.id));

        if (addedAttachments.length !== 0) {
            embed.addField("Added Attachments", addedAttachments.map(a => `[${a.filename}](${a.url})`).join(", "));
        }

        if (removedAttachments.length !== 0) {
            embed.addField("Removed Attachments", removedAttachments.map(a => `[${a.filename}](${a.url})`).join(", "));
        }

        await this.rest.channels.createMessage(config.eventChannelID, {
            embeds: embed.toJSON(true)
        });
    }
});
