export class Article {
    constructor(fields) {
        for (let key of Object.values(Article.Tags)) {
            this[key] = fields[key] ?? "";
        }
    }

    static Tags = {
        TITLE: "title",
        LINK: "link",
        GUID: "guid",
        CREATOR: "dc:creator",
        DESCRIPTION: "description",
        CONTENT: "content:encoded",
        PUB_DATE: "pubDate"
    }

    static fromElement(xml) {
        let fields = Object.values(Article.Tags).reduce((accu, tag) => {
            let value = xml.getElementsByTagName(tag)[0]?.textContent;
            if (value) {
                accu[tag] = value;
            }
            return accu;
        }, {});
        return new Article(fields);
    }

    toString() {
        return Object.values(Article.Tags).reduce((accu, tag) => {
            return `${accu}<${tag}>${this[tag]}</${tag}>`;
        }, "<item>") + "</item>";
    }

    set(tag, value) {
        this[tag] = value;
    }

    get(tag) {
        return this[tag];
    }

    setContent(value) {
        this.set(Article.Tags.CONTENT, value);
    }

    getContent() {
        return this.get(Article.Tags.CONTENT);
    }
}

export class Feed {
    constructor(fields, articles = []) {
        for (let key of Object.values(Feed.Tags)) {
            this[key] = fields[key] ?? "";
        }
        this.articles_ = articles;
    }

    static Tags = {
        TITLE: "title",
        ATOM_LINK: "atom:link",
        LINK: "link",
        DESCRIPTION: "description",
        LANGUAGE: "language",
        LAST_BUILD_DATE: "lastBuildDate",
    }

    static fromElement(xml) {
        let fields = Object.values(Feed.Tags).reduce((accu, tag) => {
            let value = xml.getElementsByTagName(tag)[0]?.textContent;
            if (value) {
                accu[tag] = value;
            }
            return accu;
        }, {});
        let articles = [...xml.querySelectorAll("item")].map((el) => Article.fromElement(el));
        return new Feed(fields, articles);
    }

    toString() {
        let articles = this.articles_.map((article) => article.toString());
        return Object.values(Feed.Tags).reduce((accu, tag) => {
            return `${accu}<${tag}>${this[tag]}</${tag}>`;
        }, '<rss xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" version="2.0"><channel>') + `${articles}</channel></rss>`;
    }
}
