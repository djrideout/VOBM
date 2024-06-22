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
        MEDIA: "media:content",
        CREATOR: "dc:creator",
        DESCRIPTION: "description",
        CONTENT: "content:encoded",
        PUB_DATE: "pubDate"
    }

    static Prefix(tag) {
        switch (tag) {
            case Article.Tags.DESCRIPTION:
            case Article.Tags.CONTENT:
                return "<![CDATA[";
            default:
                return "";
        }
    }

    static Postfix(tag) {
        switch (tag) {
            case Article.Tags.DESCRIPTION:
            case Article.Tags.CONTENT:
                return "]]>";
            default:
                return "";
        }
    }

    static fromElement(xml) {
        let fields = Object.values(Article.Tags).reduce((accu, tag) => {
            let el = xml.getElementsByTagName(tag)[0];
            if (el) {
                let value = null;
                switch (tag) {
                    case Article.Tags.MEDIA:
                        value = el.outerHTML;
                        break;
                    default:
                        value = el.textContent;
                        break;
                }
                accu[tag] = value;
            }
            return accu;
        }, {});
        return new Article(fields);
    }

    toString() {
        return Object.values(Article.Tags).reduce((accu, tag) => {
            switch (tag) {
                case Article.Tags.MEDIA:
                    return `${accu}${this[tag]}`;
                default:
                    return `${accu}<${tag}>${Article.Prefix(tag)}${this[tag]}${Article.Postfix(tag)}</${tag}>`;
            }
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

    getGUID() {
        return this.get(Article.Tags.GUID);
    }

    getPubDate() {
        return this.get(Article.Tags.PUB_DATE);
    }

    setDescription(value) {
        this.set(Article.Tags.DESCRIPTION, value);
    }

    clone() {
        let next = {};
        for (let key of Object.values(Article.Tags)) {
            next[key] = this[key];
        }
        return new Article(next);
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
            let el = xml.getElementsByTagName(tag)[0];
            if (el) {
                let value = null;
                switch (tag) {
                    case Feed.Tags.ATOM_LINK:
                        value = el.getAttribute("href");
                        break;
                    default:
                        value = el.textContent;
                        break;
                }
                accu[tag] = value;
            }
            return accu;
        }, {});
        let articles = [...xml.querySelectorAll("item")].map((el) => Article.fromElement(el));
        return new Feed(fields, articles);
    }

    toString() {
        let articles = this.articles_.reduce((accu, article) => {
            return `${accu}${article.toString()}`;
        }, "");
        return Object.values(Feed.Tags).reduce((accu, tag) => {
            switch (tag) {
                case Feed.Tags.ATOM_LINK:
                    return `${accu}<${tag} href="${this[tag]}" rel="self" type="application/rss+xml" />`
                default:
                    return `${accu}<${tag}>${this[tag]}</${tag}>`;
            }
        }, '<rss xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/" version="2.0"><channel>') + `${articles}</channel></rss>`;
    }

    getArticles() {
        return [...this.articles_];
    }

    addArticle(article) {
        this.articles_.unshift(article);
        this.articles_.splice(10);
        this.articles_.sort((a, b) => new Date(b.getPubDate()) - new Date(a.getPubDate()));
    }

    getArticleByGUID(guid) {
        return this.articles_.find((article) => article.getGUID() === guid);
    }

    set(tag, value) {
        this[tag] = value;
    }

    get(tag) {
        return this[tag];
    }

    setTitle(value) {
        this.set(Feed.Tags.TITLE, value);
    }

    setLastBuildDate(value) {
        this.set(Feed.Tags.LAST_BUILD_DATE, value);
    }

    setAtomLink(value) {
        this.set(Feed.Tags.ATOM_LINK, value);
    }

    setDescription(value) {
        this.set(Feed.Tags.DESCRIPTION, value);
    }
}
