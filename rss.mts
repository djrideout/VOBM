const ArticleTags = [
    "title",
    "link",
    "guid",
    "media:content",
    "dc:creator",
    "description",
    "content:encoded",
    "pubDate",
    "category",
] as const;

type ArticleTag = (typeof ArticleTags)[number];

export class Article {
    private data_: Record<ArticleTag, string> = ArticleTags.reduce(
        (acc, tag) => {
            acc[tag] = "";
            return acc;
        },
        {} as Record<ArticleTag, string>,
    );

    constructor(fields: Partial<Record<ArticleTag, string>>) {
        for (let tag of ArticleTags) {
            this.data_[tag] = fields[tag] ?? "";
        }
    }

    getFormattedField_(tag: ArticleTag) {
        let value = this.data_[tag];
        let prefix = "";
        let postfix = "";
        const formattedFields: ArticleTag[] = ["description", "content:encoded", "category"];
        if (formattedFields.some((t) => tag === t)) {
            prefix = value.startsWith("<![CDATA[") ? "" : "<![CDATA[";
            postfix = value.endsWith("]]>") ? "" : "]]>";
        }
        return `${prefix}${value}${postfix}`;
    }

    static fromElement(xml: Element) {
        let fields = {};
        for (let tag of ArticleTags) {
            let el = xml.getElementsByTagName(tag)[0];
            if (el) {
                fields[tag] = tag === "media:content" ? el.outerHTML : el.textContent;
            }
        }
        return new Article(fields);
    }

    toString() {
        let output = "<item>";
        for (let tag of ArticleTags) {
            output += tag === "media:content" ? this.data_[tag] : `<${tag}>${this.getFormattedField_(tag)}</${tag}>`;
        }
        output += "</item>";
        return output;
    }

    set content(value) {
        this.data_["content:encoded"] = value;
    }

    get content() {
        return this.data_["content:encoded"];
    }

    get guid() {
        return this.data_["guid"];
    }

    get pubDate() {
        return this.data_["pubDate"];
    }

    set description(value: string) {
        this.data_["description"] = value;
    }

    get category() {
        return this.data_["category"];
    }

    clone() {
        return new Article({ ...this.data_ });
    }
}

const FeedTags = ["title", "atom:link", "link", "description", "language", "lastBuildDate"] as const;

type FeedTag = (typeof FeedTags)[number];

export class Feed {
    private data_: Record<FeedTag, string> = FeedTags.reduce(
        (acc, tag) => {
            acc[tag] = "";
            return acc;
        },
        {} as Record<FeedTag, string>,
    );
    private articles_: Article[];

    constructor(fields: Partial<Record<FeedTag, string>>, articles: Article[] = []) {
        for (let key of FeedTags) {
            this.data_[key] = fields[key] ?? "";
        }
        this.articles_ = articles;
    }

    static fromElement(xml: Document | Element) {
        let fields = {};
        for (let tag of FeedTags) {
            let el = xml.getElementsByTagName(tag)[0];
            if (el) {
                fields[tag] = tag === "atom:link" ? el.getAttribute("href") : el.textContent;
            }
        }
        let articles = [...xml.querySelectorAll("item")].map((el) => Article.fromElement(el));
        return new Feed(fields, articles);
    }

    static createEmpty() {
        let fields = {};
        for (let tag of FeedTags) {
            fields[tag] = "";
        }
        return new Feed(fields);
    }

    toString() {
        let output =
            '<rss xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/" version="2.0"><channel>';
        for (let tag of FeedTags) {
            output +=
                tag === "atom:link"
                    ? `<${tag} href="${this.data_[tag]}" rel="self" type="application/rss+xml" />`
                    : `<${tag}>${this.data_[tag]}</${tag}>`;
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

    set title(value: string) {
        this.data_["title"] = value;
    }

    set lastBuildDate(value: string) {
        this.data_["lastBuildDate"] = value;
    }

    set atomLink(value: string) {
        this.data_["atom:link"] = value;
    }

    set description(value: string) {
        this.data_["description"] = value;
    }

    addArticle(article: Article) {
        this.articles_.push(article);
        this.articles_.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
        this.articles_.splice(10);
    }

    getArticleByGUID(guid: string) {
        return this.articles_.find((article) => article.guid === guid);
    }
}
