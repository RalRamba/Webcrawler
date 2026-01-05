import {JSDOM} from "jsdom";

export function normalizeURL(target_url:string) {
    //console.log("Normalizing URL " + target_url);
    let working_URL:URL = new URL(target_url);
    let normalized_url:string = working_URL.hostname + working_URL.pathname;
    if (normalized_url.slice(-1) === "/") {
        normalized_url = normalized_url.slice(0, -1)
    };
    return normalized_url
}


export function getH1fromHTML(html:string){
const dom = new JSDOM(html);
    const h1Element = dom.window.document.querySelector("h1");
    if (h1Element) {
        return h1Element.textContent || "";
    } else {
        return "";
    }
};

export function getFirstParagraphFromHTML(html:string){
const dom = new JSDOM(html);
     const mainElement = dom.window.document.querySelector("main");
     if (mainElement) {
        const pElement = mainElement.querySelector("p");
        if(pElement) {
            return pElement?.textContent
        }
     }
     else {
        const pElement = dom.window.document.querySelector("p");
        if(pElement) {
            return pElement?.textContent
        }   
        else {
            return "";
        }
     }
};


export function getURLsFromHTML(html: string, baseURL: string): string[]{
    const dom = new JSDOM(html);
    const aElements = dom.window.document.querySelectorAll("a");
    const urls: string[] = []; 
    aElements.forEach((aElement) => {
        const href = aElement.getAttribute("href");
        if (href) {
            try {
                const url = new URL(href, baseURL);
                if (url.href.slice(-1) === "/") {
                let normalized:string = url.href.slice(0, -1)
                urls.push(normalized);
                return;
                };
                urls.push(url.href);
                return;
            } catch (error) {
            }
        }
});
    return urls;
};


export function getImagesFromHTML(html: string, baseURL: string): string[]{
    const dom = new JSDOM(html);
    const imgElements = dom.window.document.querySelectorAll("img");
    const srcs: string[] = []; 
    imgElements.forEach((imgElements) => {
        const src = imgElements.getAttribute("src");
        if (src) {
            try {
                const images = new URL(src, baseURL);
                srcs.push(images.href);
            } catch (error) {
            }
        }
});
    return srcs;
};


export function extractPageData(html:string, pageURL:string): ExtractedPageData{
    const h1 = getH1fromHTML(html);
    const firstParagraph = getFirstParagraphFromHTML(html);
    const urls = getURLsFromHTML(html, pageURL);
    const images = getImagesFromHTML(html, pageURL);
    return {
        url: pageURL,
        h1: h1,
        first_paragraph: firstParagraph,
        outgoing_links: urls,
        image_urls: images
    };
};
