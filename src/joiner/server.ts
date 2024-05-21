import { addUser } from "./discordLink.js";
import config from "../config.js";
import DiscordBot from "../client.js";
import { normalizeName } from "../util/util.js";
import express from "express";
import { create } from "express-handlebars";
import { DiscordRESTError, JSONErrorCodes, OAuthHelper, OAuthScopes } from "oceanic.js";
import Logger from "@uwu-codes/logger";
import morgan from "morgan";
import { createHash } from "node:crypto";

const app = express()
    .engine("hbs", create({
        extname:       "hbs",
        defaultLayout: false
    }).engine)
    .set("view engine", "hbs")
    .set("views", config.viewsDir)
    .set("view options", { pretty: true })
    .set("trust proxy", true)
    .set("x-powered-by", false)
    .use(morgan("dev"))
    .get("/", async(req, res) => {
        const user_id = Number(req.query.user_id);
        const user_name = req.query.user_name as string;
        const time = Number(req.query.time);
        const hash = req.query.hash as string;
        if (!user_id || !user_name || !time || !hash) {
            return res.status(400).render("main", { title: "Bad Request", message: "Bad Request" });
        }
        if ((Date.now() / 1000) > time) {
            return res.status(403).render("main", { title: "Timed Out", message: "You took too long to authorize the request. Please try again." });
        }
        const auth = createHash("sha256").update(`${user_id};${user_name};${time};${config.joinerSecret};index`).digest("hex");

        if (hash !== auth) {
            return res.status(403);
        }
        const t = (Date.now() / 1000) + 5 * 60 * 1000;
        const state = Buffer.from(JSON.stringify({
            user_id,
            user_name,
            time: t,
            hash: createHash("sha256").update(`${user_id};${user_name};${t};${config.joinerSecret};discord`).digest("hex")
        }), "utf8").toString("base64url");
        const url = OAuthHelper.constructURL({
            scopes:      [OAuthScopes.IDENTIFY, OAuthScopes.GUILDS_JOIN],
            clientID:    config.discord.id,
            state,
            redirectURI: `${config.joinerURL}/callback`
        });

        return res.redirect(url);
    })
    .get("/callback", async(req, res) => {
        const code = req.query.code as string, state = req.query.state as string;
        if (!code || !state) {
            return res.status(400).render("main", { title: "Bad Request", message: "Bad Request" });
        }
        const { hash, time, user_id, user_name } = JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as { hash: string; time: number; user_id: number; user_name: string; };
        if (!user_id || !user_name || !time || !hash) {
            return res.status(400).render("main", { title: "Bad Request", message: "Bad Request" });
        }
        if ((Date.now() / 1000) > time) {
            return res.status(403).render("main", { title: "Timed Out", message: "You took too long to authorize the request. Please try again." });
        }
        const auth = createHash("sha256").update(`${user_id};${user_name};${time};${config.joinerSecret};discord`).digest("hex");

        if (hash !== auth) {
            return res.status(403);
        }

        const { accessToken } = await DiscordBot.get().rest.oauth.exchangeCode({
            code,
            clientID:     config.discord.id,
            clientSecret: config.discord.secret,
            redirectURI:  `${config.joinerURL}/callback`
        });

        const helper = DiscordBot.get().getOAuthHelper(`Bearer ${accessToken}`);
        const discordUser = await helper.getCurrentUser();
        await addUser(user_id, discordUser.id);
        try {
            await helper.addGuildMember(config.guildID, discordUser.id, { nick: normalizeName(user_name), roles: [config.memberRoleID] });
            await helper.revokeToken({ clientID: config.discord.id, clientSecret: config.discord.secret })
                .catch(err => Logger.getLogger("joiner").warn(`Failed to revoke token: ${err}`));

            return res.status(200).render("main", { title: "Success", message: `You have been added to the server. <a href="https://discord.com/channels/${config.guildID}">See you there.</a>` });
        } catch (err) {
            let message = "An unknown error occured.";
            if (err instanceof DiscordRESTError) {
                const messages: Record<number, string> = {
                    [JSONErrorCodes.TOO_MANY_GUILDS]:   "You are at the discord server limit. Try again after you have left some servers.",
                    [JSONErrorCodes.INVITES_DISABLED]:  "Joining our discord server is currently disabled. Try again at a later date.",
                    [JSONErrorCodes.USER_BANNED]:       "You are either IP banned by discord (are you using a VPN?) or banned from the server. Server bans may be appealed by writing an email to admin@pawsmov.in.",
                    [JSONErrorCodes.UNDER_MINIMUM_AGE]: "Could not add you to the server. Make sure you are able to access other NSFW-marked servers on your discord client."
                };
                if (messages[err.code]) {
                    message = messages[err.code];
                }

                await DiscordBot.get().rest.channels.createMessage(config.joinerChannelID, {
                    content: `${config.baseURL}/users/${user_id} tried to join as ${discordUser.id} (${discordUser.tag}) and got:\n\`\`\`json\n${JSON.stringify(err.resBody, null, "\t")}\`\`\``
                });
            }
            Logger.getLogger("Joiner").error(err);

            return res.status(400).render("main", { title: "Error", message });
        }
    })
    .use(async(_req, res) => res.status(404).render("main", { title: "Not Found" }))
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .use(async(err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        Logger.getLogger("Joiner").error(err);

        return res.status(500).render("main", { title: "Error", message: "An unknown error occured." });
    });

app.listen(config.joinerPort, "0.0.0.0", () => Logger.getLogger("Joiner").info(`Listening on 0.0.0.0:${config.joinerPort}`));
