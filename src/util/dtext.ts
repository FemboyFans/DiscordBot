import config from "../config.js";

const replacements = [
    [/post changes #(\d+)/gi, (_match: string, id: string) => `<${config.baseURL}/posts/versions?search[post_id]=${id}>`],
    [/flag #(\d+)/gi, (_match: string, id: string) => `<${config.baseURL}/posts/flags/${id}>`],
    [/note #(\d+)/gi, (_match: string, id: string) => `<${config.baseURL}/notes/${id}>`],
    // TODO: post # catching " post" & "post" here
    [/forum(?: ?post)? #(\d+)/gi, (_match: string, id: string) => `<${config.baseURL}/forum_posts/${id}>`],
    //  [/(?:forum )?topic #(\d+)\/p(\d+)/gi, (_match: string, id: string, page: string) => `<${config.baseURL}/forum_topics/${id}?page=${page}>`],
    [/(?:forum )?topic #(\d+)/gi, (_match: string, id: string) => `<${config.baseURL}/forum_topics/${id}>`],
    [/comment #(\d+)/gi, (_match: string, id: string) => `<${config.baseURL}/comments/${id}>`],
    [/dmail #(\d+)/gi, (_match: string, id: string) => `<${config.baseURL}/dmails/${id}>`],
    [/pool #(\d+)/gi, (_match: string, id: string) => `<${config.baseURL}/pools/${id}>`],
    [/user #(\d+)/gi, (_match: string, id: string) => `<${config.baseURL}/users/${id}>`],
    [/artist #(\d+)/gi, (_match: string, id: string) => `<${config.baseURL}/artists/${id}>`],
    [/artist changes #(\d+)/gi, (_match: string, id: string) => `<${config.baseURL}/artists/versions?search[artist_id]=${id}>`],
    [/ban #(\d+)/gi, (_match: string, id: string) => `<${config.baseURL}/bans/${id}>`],
    [/bur #(\d+)/gi, (_match: string, id: string) => `<${config.baseURL}/bulk_update_requests/${id}>`],
    [/alias #(\d+)/gi, (_match: string, id: string) => `<${config.baseURL}/tags/aliases/${id}>`],
    [/implication #(\d+)/gi, (_match: string, id: string) => `<${config.baseURL}/tags/implications/${id}>`],
    [/mod action #(\d+)/gi, (_match: string, id: string) => `<${config.baseURL}/mod_actions/${id}>`],
    [/record #(\d+)/gi, (_match: string, id: string) => `<${config.baseURL}/users/feedbacks/${id}>`],
    [/wiki(?: ?page)? #(\d+)/gi, (_match: string, id: string) => `<${config.baseURL}/wiki_pages/${id}>`],
    [/wiki(?: ?page)? changes #(\d+)/gi, (_match: string, id: string) => `<${config.baseURL}/wiki_pages/versions?search[wiki_page_id]=${id}>`],
    [/set #(\d+)/gi, (_match: string, id: string) => `<${config.baseURL}/post_sets/${id}>`],
    [/ticket #(\d+)/gi, (_match: string, id: string) => `<${config.baseURL}/tickets/${id}>`],
    [/take ?down(?: request)? #(\d+)/gi, (_match: string, id: string) => `<${config.baseURL}/takedowns/${id}>`],
    [/dnp #(\d+)/gi, (_match: string, id: string) => `<${config.baseURL}/avoid_postings/${id}>`],
    [/avoid posting #(\d+)/gi, (_match: string, id: string) => `<${config.baseURL}/avoid_postings/${id}>`],
    [/\[\[(\d+)]]/gi, (_match: string, id: string) => `<${config.baseURL}/wiki_pages/${id}>`],
    [/\[\[([\S ]+)]]/gi, (_match: string, title: string) => `<${config.baseURL}/wiki_pages/show_or_new?title=${title.replaceAll(" ", "_")}>`],
    [/{{([\S ]+)}}/gi, (_match: string, tags: string) => `<${config.baseURL}/posts?tags=${tags.replaceAll(" ", "%20")}>`]
] as const;

export function formatDtext(text: string) {
    let result = "";
    // Don't parse the same text twice, give priority to earlier entries
    const ignore: Array<string> = [];
    for (const [regex, replacement] of replacements) {
        inner: for (const match of text.matchAll(regex)) {
            if (ignore.includes(match[0])) {
                continue inner;
            }
            ignore.push(match[0]);
            result += `${match[0].replaceAll(regex, replacement)}\n`;
        }
    }

    return result;
}
