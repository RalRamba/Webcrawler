import { JSDOM } from "jsdom";
export function normalizeURL(target_url) {
    console.log("Normalizing URL " + target_url);
    let working_URL = new URL(target_url);
    let normalized_url = working_URL.hostname + working_URL.pathname;
    if (normalized_url.slice(-1) === "/") {
        normalized_url = normalized_url.slice(0, -1);
    }
    ;
    return normalized_url;
}
export function getH1fromHTML(html) {
    const dom = new JSDOM(html);
    const h1Element = dom.window.document.querySelector("h1");
    if (h1Element) {
        return h1Element.textContent || "";
    }
    else {
        return "";
    }
}
;
export function getFirstParagraphFromHTML(html) {
    const dom = new JSDOM(html);
    const pElement = dom.window.document.querySelector("p");
    if (pElement) {
        return pElement.textContent || "";
    }
    else {
        return "";
    }
}
;
