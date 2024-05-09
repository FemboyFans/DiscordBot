import ClientEvent from "../util/ClientEvent.js";
import EncryptionHandler from "../util/EncryptionHandler.js";
import Redis from "../Redis.js";
import { handleLinks } from "../util/handleLinks.js";

export default new ClientEvent("messageCreate", async function(msg) {
    if (msg.guildID && msg.author.id !== this.user.id) {
        await Redis.set(`discord-messages:${msg.id}`, EncryptionHandler.encrypt(JSON.stringify(msg.toJSON())));
    }
    if (msg.inCachedGuildChannel()) {
        await handleLinks(msg);
    }

});
