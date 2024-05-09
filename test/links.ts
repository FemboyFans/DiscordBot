import config from "../src/config.js";
import { formatDtext } from "../src/util/dtext.js";
import { expect } from "chai";
import { type SinonStub, stub } from "sinon";

describe.only("Links", () => {
    let stubInstance: SinonStub;
    before(() => {
        stubInstance = stub(config, "baseURL").value("http://localhost");
    });
    after(() => {
        stubInstance.restore();
    });

    it("Should parse correctly", () => {
        expect(formatDtext("post changes #1")).eq("<http://localhost/posts/versions?search[post_id]=1>\n");
        expect(formatDtext("flag #1")).eq("<http://localhost/posts/flags/1>\n");
        expect(formatDtext("note #1")).eq("<http://localhost/notes/1>\n");
        expect(formatDtext("forum post #1")).eq("<http://localhost/forum_posts/1>\n");
        expect(formatDtext("forumpost #1")).eq("<http://localhost/forum_posts/1>\n");
        expect(formatDtext("forum #1")).eq("<http://localhost/forum_posts/1>\n");
        expect(formatDtext("forum topic #1")).eq("<http://localhost/forum_topics/1>\n");
        expect(formatDtext("topic #1")).eq("<http://localhost/forum_topics/1>\n");
        // expect(formatDtext("forum topic #1/p2")).eq("<http://localhost/forum_topics/1?page=2>\n");
        // expect(formatDtext("topic #1/p2")).eq("<http://localhost/forum_topics/1?page=2>\n");
        expect(formatDtext("comment #1")).eq("<http://localhost/comments/1>\n");
        expect(formatDtext("dmail #1")).eq("<http://localhost/dmails/1>\n");
        expect(formatDtext("pool #1")).eq("<http://localhost/pools/1>\n");
        expect(formatDtext("user #1")).eq("<http://localhost/users/1>\n");
        expect(formatDtext("artist #1")).eq("<http://localhost/artists/1>\n");
        expect(formatDtext("artist changes #1")).eq("<http://localhost/artists/versions?search[artist_id]=1>\n");
        expect(formatDtext("ban #1")).eq("<http://localhost/bans/1>\n");
        expect(formatDtext("bur #1")).eq("<http://localhost/bulk_update_requests/1>\n");
        expect(formatDtext("alias #1")).eq("<http://localhost/tags/aliases/1>\n");
        expect(formatDtext("implication #1")).eq("<http://localhost/tags/implications/1>\n");
        expect(formatDtext("mod action #1")).eq("<http://localhost/mod_actions/1>\n");
        expect(formatDtext("record #1")).eq("<http://localhost/users/feedbacks/1>\n");
        expect(formatDtext("wiki page #1")).eq("<http://localhost/wiki_pages/1>\n");
        expect(formatDtext("wikipage #1")).eq("<http://localhost/wiki_pages/1>\n");
        expect(formatDtext("wiki #1")).eq("<http://localhost/wiki_pages/1>\n");
        expect(formatDtext("wiki page changes #1")).eq("<http://localhost/wiki_pages/versions?search[wiki_page_id]=1>\n");
        expect(formatDtext("wikipage changes #1")).eq("<http://localhost/wiki_pages/versions?search[wiki_page_id]=1>\n");
        expect(formatDtext("wiki changes #1")).eq("<http://localhost/wiki_pages/versions?search[wiki_page_id]=1>\n");
        expect(formatDtext("set #1")).eq("<http://localhost/post_sets/1>\n");
        expect(formatDtext("ticket #1")).eq("<http://localhost/tickets/1>\n");
        expect(formatDtext("take down #1")).eq("<http://localhost/takedowns/1>\n");
        expect(formatDtext("takedown #1")).eq("<http://localhost/takedowns/1>\n");
        expect(formatDtext("dnp #1")).eq("<http://localhost/avoid_postings/1>\n");
        expect(formatDtext("avoid posting #1")).eq("<http://localhost/avoid_postings/1>\n");
        expect(formatDtext("[[1]]")).eq("<http://localhost/wiki_pages/1>\n");
        expect(formatDtext("[[gay]]")).eq("<http://localhost/wiki_pages/show_or_new?title=gay>\n");
        expect(formatDtext("[[gay homo]]")).eq("<http://localhost/wiki_pages/show_or_new?title=gay_homo>\n");
        expect(formatDtext("{{gay}}")).eq("<http://localhost/posts?tags=gay>\n");
        expect(formatDtext("{{gay homo}}")).eq("<http://localhost/posts?tags=gay%20homo>\n");
    });
});
