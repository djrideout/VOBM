import fs from "node:fs/promises";
import jsdom from "jsdom";
import { Article, Feed } from "./rss.mjs";

const { JSDOM } = jsdom;
global.DOMParser = new (new JSDOM()).window.DOMParser();

let xml = await fetch("https://vocm.com/feed/").then(v => v.text());
let parsed = DOMParser.parseFromString(xml, "application/xml");
let feed = Feed.fromElement(parsed);
await fs.mkdir("gh-pages", { recursive: true });
await fs.writeFile("gh-pages/rss.xml", feed.toString());
