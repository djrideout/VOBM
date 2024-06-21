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

    static fromString(xml) {
        let parsed = DOMParser.parseFromString(xml, "application/xml");
        let fields = Object.values(Article.Tags).reduce((accu, tag) => {
            let value = parsed.getElementsByTagName(tag)[0]?.textContent;
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
