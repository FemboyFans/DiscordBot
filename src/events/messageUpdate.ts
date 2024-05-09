import ClientEvent from "../util/ClientEvent.js";
import EncryptionHandler from "../util/EncryptionHandler.js";
import Redis from "../Redis.js";
import { handleLinks } from "../util/handleLinks.js";
import config from "../config.js";
import { EmbedBuilder } from "@oceanicjs/builders";
import type { JSONMessage } from "oceanic.js";

export default new ClientEvent("messageUpdate", async function(msg) {
    if (!msg.guildID || msg.author.id === this.user.id) {
        return;
    }
    const old = await Redis.get(`discord-messages:${msg.id}`);
    await Redis.set(`discord-messages:${msg.id}`, EncryptionHandler.encrypt(JSON.stringify(msg.toJSON())));

    if (msg.inCachedGuildChannel()) {
        await handleLinks(msg);
    }

    if (old) {
        const { attachments, content } = JSON.parse(EncryptionHandler.decrypt(old)) as JSONMessage;
        const embed = new EmbedBuilder()
            .setTitle("Edited Message")
            .setColor(0xFFFF00)
            .setTimestamp(msg.createdAt)
            .addField("Channel", `<#${msg.channelID}>`, true)
            .addField("User", `<@${msg.author.id}>`, true)
            .addField("Message", msg.jumpLink, true);

        if (msg.content !== content) {
            embed.addField("Before", content.slice(0, 2000));
            embed.addField("After", msg.content.slice(0, 2000));
        }

        const addedAttachments = msg.attachments.toArray().filter(a => !attachments.some(att => att.id === a.id));
        const removedAttachments = attachments.filter(att => !msg.attachments.toArray().some(a => a.id === att.id));

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
