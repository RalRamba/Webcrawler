import {JSDOM} from "jsdom";
import { get } from "node:http";
import { stringify } from "node:querystring";



export function main(){
    let crawled_urls:string[] = [];
    console.log("Crawler Loaded, targeting:");
    console.log(process.argv[2]);
    if (process.argv.length < 3) {
        console.error("No URL provided. Please provide a target URL");
        process.exit(1);
    }
    else{
        if (process.argv.length > 3 ){
            console.error("Too many arguments provided. Please provide a single target URL");
            process.exit(1);
        }
        else {
            let finalpages = crawlPage(getBaseURL(process.argv[2]), process.argv[2], {}).then((pages)=>{
                console.log("Crawling complete.");
                console.log("Crawled Pages:");
                console.log(pages);
            });
        }
    }
};

//function to retrieve HTML from a provided URL
async function getHTML(url:string){
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const html = await response.text();
    return html;
};


//function to check if an URL is in the scope of the current crawl
export function urlcheck(target_url:string){
    try {
        if ((getBaseURL(target_url)) == (getBaseURL(process.argv[2]))){
            return true;
        };
            console.log("urlcheck returned false for " + target_url + ", URL appears OOS.");
            return false;

    } catch (error) {
        return false;
    }
}

//crawler function to abstract crawling logic for recursive use
async function crawlPage(
    baseURL:string,
    currentURL:string,
    pages: Record<string, number>,
): Promise<Record<string, number>>{
    console.log("Crawling: " + currentURL);
    try {
        const html = await getHTML(currentURL);
        const pageData = extractPageData(html, currentURL);
        for (const link of pageData.outgoing_links){
                if (urlcheck(link)){
                    if (!(link in pages)){
                        pages[link] = 1;
                        await crawlPage(baseURL, link, pages);
                    } else {
                            pages[link] += 1;
                            //console.log("Already crawled " + link + ", incrementing visit count to " + pages[link] );
                    }
                }
        }
                    return pages;        
    }catch (error) {
            console.error("Error crawling the page: " + error);
            return pages;
    }           
};

export function getBaseURL(target_url:string) {
    //console.log("Normalizing URL " + target_url);
    let working_URL:URL = new URL(target_url);
    let baseURL:string = working_URL.hostname;
    if (baseURL.slice(-1) === "/") {
        baseURL = baseURL.slice(0, -1)
    };
    return baseURL
}



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

