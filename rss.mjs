export class Article {
    constructor(fields) {
        this.data_ = {};
        for (let tag of Article.TagValues) {
            this.data_[tag] = fields[tag] ?? "";
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
        PUB_DATE: "pubDate",
        CATEGORY: "category"
    }

    static get TagValues() {
        return Object.values(Article.Tags);
    }

    getFormattedField_(tag) {
        let value = this.data_[tag];
        let prefix = "";
        let postfix = "";
        if ([
            Article.Tags.DESCRIPTION,
            Article.Tags.CONTENT,
            Article.Tags.CATEGORY
        ].some((t) => tag === t)) {
            prefix = value.startsWith("<![CDATA[") ? "" : "<![CDATA[";
            postfix = value.endsWith("]]>") ? "" : "]]>";
        }
        return `${prefix}${value}${postfix}`;
    }

    static fromElement(xml) {
        let fields = {};
        for (let tag of Article.TagValues) {
            let el = xml.getElementsByTagName(tag)[0];
            if (el) {
                fields[tag] = tag === Article.Tags.MEDIA ? el.outerHTML : el.textContent;
            }
        }
        return new Article(fields);
    }

    toString() {
        let output = "<item>";
        for (let tag of Article.TagValues) {
            output += tag === Article.Tags.MEDIA ? this.data_[tag] : `<${tag}>${this.getFormattedField_(tag)}</${tag}>`;
        }
        output += "</item>";
        return output;
    }

    set content(value) {
        this.data_[Article.Tags.CONTENT] = value;
    }

    get content() {
        return this.data_[Article.Tags.CONTENT];
    }

    get guid() {
        return this.data_[Article.Tags.GUID];
    }

    get pubDate() {
        return this.data_[Article.Tags.PUB_DATE];
    }

    set description(value) {
        this.data_[Article.Tags.DESCRIPTION] = value;
    }

    get category() {
        return this.data_[Article.Tags.CATEGORY];
    }

    clone() {
        return new Article({ ...this.data_ });
    }
}

export class Feed {
    constructor(fields, articles = []) {
        this.data_ = {};
        for (let key of Feed.TagValues) {
            this.data_[key] = fields[key] ?? "";
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

    static get TagValues() {
        return Object.values(Feed.Tags);
    }

    static fromElement(xml) {
        let fields = {};
        for (let tag of Feed.TagValues) {
            let el = xml.getElementsByTagName(tag)[0];
            if (el) {
                fields[tag] = tag === Feed.Tags.ATOM_LINK ? el.getAttribute("href") : el.textContent;
            }
        }
        let articles = [...xml.querySelectorAll("item")].map((el) => Article.fromElement(el));
        return new Feed(fields, articles);
    }

    toString() {
        let output = '<rss xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/" version="2.0"><channel>';
        for (let tag of Feed.TagValues) {
            output += tag === Feed.Tags.ATOM_LINK ? `<${tag} href="${this.data_[tag]}" rel="self" type="application/rss+xml" />` : `<${tag}>${this.data_[tag]}</${tag}>`;
        }
        for (let article of this.articles_) {
            output += article.toString();
        }
        output += "</channel></rss>";
        return output;
    }

    get articles() {
        return [...this.articles_];
    }

    set title(value) {
        this.data_[Feed.Tags.TITLE] = value;
    }

    set lastBuildDate(value) {
        this.data_[Feed.Tags.LAST_BUILD_DATE] = value;
    }

    set atomLink(value) {
        this.data_[Feed.Tags.ATOM_LINK] = value;
    }

    set description(value) {
        this.data_[Feed.Tags.DESCRIPTION] = value;
    }

    addArticle(article) {
        this.articles_.push(article);
        this.articles_.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
        this.articles_.splice(10);
    }

    getArticleByGUID(guid) {
        return this.articles_.find((article) => article.guid === guid);
    }
}
