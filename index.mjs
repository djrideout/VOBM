import jsdom from "jsdom";
import { Article } from "./rss.mjs";

const { JSDOM } = jsdom;
global.DOMParser = new (new JSDOM()).window.DOMParser();

let xml = await fetch("https://vocm.com/feed/").then(v => v.text());
let parsed = DOMParser.parseFromString(xml, "application/xml");
let article = Article.fromString(parsed.querySelector("item").outerHTML);
article.setContent("yeah we set that content");
console.log(article.toString());
