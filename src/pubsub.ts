import DiscordBot from "./client.js";
import config from "./config.js";
import { getMentions } from "./phrases.js";
import Redis from "./Redis.js";
import { ucwords } from "./util/util.js";
import { type EmbedOptions } from "oceanic.js";

export interface TicketActionData {
    action: string;
    ticket: TicketData;
}
export interface TicketData {
    claimant: string | null;
    id: number;
    model_id: number;
    model_type: string;
    reason: string;
    report_type?: string;
    status: string;
    target: string;
    user_id: number;
    user_name: string;
}
export async function ticketUpdate(data: TicketActionData) {
    const color = data.ticket.claimant === null ? 0xFF0000 : 0x00FFFF;
    const claimant = data.ticket.claimant || "<Unclaimed>";
    const offender = ({
        Comment:   () => `Comment by ${data.ticket.target}`,
        Dmail:     () => `DMail sent by ${data.ticket.target}`,
        ForumPost: () => `Forum post by ${data.ticket.target}`,
        Pool:      () => `Pool ${data.ticket.target}`,
        Post:      () => `Post uploaded by ${data.ticket.target}`,
        PostSet:   () => `Set ${data.ticket.target}`,
        User:      () => `${ucwords(data.ticket.report_type ?? "report")} for ${data.ticket.target}`,
        WikiPage:  () => `Wiki page ${data.ticket.target}`
    }[data.ticket.model_type] || (() => `${data.ticket.model_type} report by ${data.ticket.user_name}`))();
    const embed = {
        url:         `http://localhost:3001/tickets/${data.ticket.id}`,
        title:       offender,
        description: data.ticket.reason.slice(0, 1000),
        author:      {
            url:  `http://localhost:3001/users/${data.ticket.user_id}`,
            name: data.ticket.user_name
        },
        color,
        fields: [
            {
                name:   "Type",
                value:  data.ticket.model_type,
                inline: true
            },
            {
                name:   "Status",
                value:  data.ticket.status,
                inline: true
            },
            {
                name:   "Claimed By",
                value:  claimant,
                inline: true
            }
        ]
    } satisfies EmbedOptions;

    switch (data.action) {
        case "create": {
            const { id } = await DiscordBot.get().rest.channels.createMessage(config.ticketChannelID, { embeds: [embed] });
            await Redis.set(`ticket-messages:${data.ticket.id}`, id);
            const mentions = await getMentions(data.ticket.reason);
            if (mentions.trim().length !== 0) {
                await DiscordBot.get().rest.channels.createMessage(config.ticketChannelID, { content: mentions, allowedMentions: { everyone: false, users: true, roles: Object.values(config.roles) } });
            }
            break;
        }

        default: {
            const id = await Redis.get(`ticket-messages:${data.ticket.id}`);
            if (id) {
                await DiscordBot.get().rest.channels.editMessage(config.ticketChannelID, id, { embeds: [embed] });
            }
            break;
        }
    }
}
