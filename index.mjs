import fs from "node:fs/promises";
import "dotenv/config";
import OpenAI from "openai";
import jsdom from "jsdom";
import _ from "lodash";
import { Feed } from "./rss.mjs";

const { JSDOM } = jsdom;
global.DOMParser = new (new JSDOM()).window.DOMParser();

const title = "VOBM";
const description = "Voice of Bayman";
const xmlDir = "gh-pages";
const xmlPath = `${xmlDir}/rss.xml`;
const xmlURL = "https://djrideout.github.io/VOBM/rss.xml";
const vocmURL = "https://vocm.com/feed/";

const prompt = (content) => `You are a stereotypical person from Newfoundland, what one may call a "bayman". You need to summarize the contents of this news article, and do so the same way you would in casual conversation, while maybe throwing in a sarcastic comment or personal opinion on the matter: ${content}`;

let curr = null;
try {
    curr = Feed.fromElement(DOMParser.parseFromString(await fs.readFile(xmlPath, "utf8"), "application/xml"));
} catch (ex) {
    console.log(`Cannot read ${xmlPath}: ${ex.message}`);
    process.exit(); // Recreate this manually if it breaks
}

let next = null;
try {
    next = Feed.fromElement(DOMParser.parseFromString(await fetch(vocmURL).then((res) => res.text()), "application/xml"));
} catch (ex) {
    console.log(`Cannot fetch ${vocmURL}: ${ex.message}`);
    process.exit(); // Nothing to compare to, so exit
}

let currArticles = curr.getArticles().map((article) => article.getGUID());
let nextArticles = next.getArticles().map((article) => article.getGUID());
let newArticles = _.intersection(nextArticles, _.xor(currArticles, nextArticles));
if (!newArticles.length) {
    console.log("No new articles");
    process.exit();
}

const openai = new OpenAI({
    organization: process.env.OPENAI_ORG_ID,
    project: process.env.OPENAI_PROJECT_ID
});

let buildDate = (new Date()).toUTCString();
curr.setTitle(title);
curr.setAtomLink(xmlURL);
curr.setDescription(description);

for (let guid of newArticles) {
    let article = next.getArticleByGUID(guid).clone();

    let result = "";
    try {
        let stream = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt(article.getContent()) }],
            stream: true
        });
        for await (const chunk of stream) {
            result += chunk.choices[0]?.delta?.content ?? "";
        }
    } catch (ex) {
        console.log(`Could not generate content: ${ex.message}`);
        continue;
    }

    article.setContent(result);
    article.setDescription(result);
    curr.addArticle(article);
    curr.setLastBuildDate(buildDate);
}

await fs.mkdir(xmlDir, { recursive: true });
await fs.writeFile(xmlPath, curr.toString());
