import ClientEvent from "../util/ClientEvent.js";
import EncryptionHandler from "../util/EncryptionHandler.js";
import Redis from "../Redis.js";
import config from "../config.js";
import { formatJumpLink } from "../util/util.js";
import { EmbedBuilder } from "@oceanicjs/builders";
import { Base, type JSONMessage, Message } from "oceanic.js";

export default new ClientEvent("messageDelete", async function(msg) {
    const old = await Redis.get(`discord-messages:${msg.id}`);

    if (old || msg instanceof Message) {
        const message = old ? JSON.parse(EncryptionHandler.decrypt(old)) as JSONMessage : (msg as Message).toJSON();
        if (!message.guildID || message.author.id === this.user.id) {
            return;
        }
        const embed = new EmbedBuilder()
            .setTitle("Deleted Message")
            .setColor(0xFF0000)
            .setTimestamp(Base.getCreatedAt(msg.id))
            .addField("Channel", `<#${message.channelID}>`, true)
            .addField("User", `<@${message.author.id}>`, true)
            .addField("Message", formatJumpLink(message.guildID, message.channelID, message.id), true);

        if (message.content) {
            embed.addField("Content", message.content.slice(0, 2000));
        }

        if (message.attachments.length !== 0) {
            embed.addField("Attachments", message.attachments.map(a => `[${a.filename}](${a.url})`).join(", "));
        }

        await this.rest.channels.createMessage(config.eventChannelID, {
            embeds: embed.toJSON(true)
        });
    }
});
