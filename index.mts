import { promises as fs } from "fs";
import "dotenv/config";
import OpenAI from "openai";
import { JSDOM } from "jsdom";
import _ from "lodash";
import { Feed } from "./rss.mjs";

const domParser = new new JSDOM().window.DOMParser();

const title = "VOBM";
const description = "Voice of Bayman";
const xmlDir = "gh-pages";
const xmlPath = `${xmlDir}/rss.xml`;
const xmlURL = "https://djrideout.github.io/VOBM/rss.xml";
const vocmURL = "https://vocm.com/feed/";

const prompt = (content: string) =>
    `You are a stereotypical person from Newfoundland, what one may call a "bayman". You need to summarize the contents of this news article, and do so the same way you would in casual conversation, while maybe throwing in a sarcastic comment or personal opinion on the matter: ${content}`;

let curr: Feed;
try {
    curr = Feed.fromElement(domParser.parseFromString(await fs.readFile(xmlPath, "utf8"), "application/xml"));
} catch (ex) {
    console.log(`Cannot read ${xmlPath}: ${ex.message}. Creating new feed...`);
    curr = Feed.createEmpty();
}

let next: Feed;
try {
    next = Feed.fromElement(
        domParser.parseFromString(await fetch(vocmURL).then((res) => res.text()), "application/xml"),
    );
} catch (ex) {
    console.log(`Cannot fetch ${vocmURL}: ${ex.message}`);
    process.exit(); // Nothing to compare to, so exit
}

let currArticles = curr.articles.map((article) => article.guid);
let nextArticles = next.articles.map((article) => article.guid);
let newArticles = _.intersection(nextArticles, _.xor(currArticles, nextArticles));
if (!newArticles.length) {
    console.log("No new articles");
    process.exit();
}
console.log("New articles:");
for (let article of newArticles) {
    console.log(`- ${article}`);
}

const openai = new OpenAI({
    organization: process.env.OPENAI_ORG_ID,
    project: process.env.OPENAI_PROJECT_ID,
});

let buildDate = new Date().toUTCString();
curr.title = title;
curr.atomLink = xmlURL;
curr.description = description;

let published = curr.articles;

for (let guid of newArticles) {
    let article = next.getArticleByGUID(guid)?.clone();

    if (!article) {
        console.log(`Article ${guid} not found in next feed, skipping...`);
        continue;
    }

    if (!article.category.includes("Local News")) {
        console.log(`Article ${guid} not Local News, skipping...`);
        continue;
    }

    if (published.length && new Date(article.pubDate) < new Date(published[0].pubDate)) {
        console.log(`Article ${guid} older than newest VOBM article, skipping...`);
        continue;
    }

    console.log(`Generating content for article ${guid}...`);
    let result = "";
    try {
        let stream = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt(article.content) }],
            stream: true,
        });
        for await (const chunk of stream) {
            let content = chunk.choices[0]?.delta?.content ?? "";
            content = content.replaceAll("VOCM", "VOBM");
            result += content;
        }
    } catch (ex) {
        console.log(`Could not generate content: ${ex.message}`);
        continue;
    }
    console.log(`Content generated for article ${guid}.`);

    article.content = result;
    article.description = result;
    curr.lastBuildDate = buildDate;
    curr.addArticle(article);
}

console.log(`Writing XML to file ${xmlPath}...`);
await fs.mkdir(xmlDir, { recursive: true });
await fs.writeFile(xmlPath, curr.toString());
console.log("Done.");
