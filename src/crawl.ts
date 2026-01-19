import {JSDOM} from "jsdom";
import { get } from "node:http";
import { url } from "node:inspector";
import { stringify } from "node:querystring";
import { promiseHooks } from "node:v8";
import pLimit from 'p-limit';
import  {writeCSVReport}  from './report.js';

export interface ExtractedPageData {
    url: string;
    h1: string;
    first_paragraph: string;
    outgoing_links: string[];
    image_urls: string[];
}



export async function main() {
    console.log("Crawler Loaded, targeting:");
    console.log(process.argv[2]);
    console.log("target file is: " + (process.argv[5] || "report.csv"));

    if (process.argv.length < 3 || process.argv.length > 6) {
        console.error("Usage: node crawler.js <URL>");
        process.exit(1);
    }

    const target = process.argv[2];
    const maxConcurrency: string = process.argv[3];
    const maxPages:string = process.argv[4];
    const filename:string = process.argv[5] || "report.csv";
    const pages = await crawlSiteAsync(target, maxConcurrency ? parseInt(maxConcurrency) : 5, maxPages ? parseInt(maxPages) : 100);

    console.log("Crawling complete.");
    console.log("Writing report to " + filename);
    writeCSVReport(pages, filename);
    //console.log("Crawled Pages:");
    //console.log(pages);


}



export function urlcheck(target_url: string) {
    try {
        return getBaseURL(target_url) === getBaseURL(process.argv[2]);
    } catch {
        return false;
    }
}


//crawler function to abstract crawling logic for recursive use


export function getBaseURL(target_url: string) {
    const u = new URL(target_url);
    return `${u.protocol}//${u.hostname}`;
}

export async function crawlSiteAsync(
  url: string,
  maxConcurrency = 5,
  maxPages = 100
): Promise<Record<string, ExtractedPageData>> {

    const base = getBaseURL(url);
    const crawler = new ConcurrentCrawler(base, {}, maxConcurrency, maxPages);
    return await crawler.crawl();
}

export function normalizeURL(target_url: string) {
    const u = new URL(target_url);

    let normalized = u.hostname + u.pathname.toLowerCase();

    // Remove trailing slash
    if (normalized.endsWith("/")) {
        normalized = normalized.slice(0, -1);
    }

    // Remove default index pages
    normalized = normalized.replace(/index\.(html|htm|php)$/, "");

    return normalized;
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


//p-limit based concurrent crawler class
class ConcurrentCrawler {
    private limit: <T>(fn: () => Promise<T>) => Promise<T>;
    private shouldStop = false;
    private allTasks = new Set<Promise<void>>();
    private abortController = new AbortController();

    constructor(
        private baseUrl: string,
        private pages: Record<string, ExtractedPageData> = {},
        private maxConcurrency = 5,
        private maxPages = 100
    ) {
        this.limit = pLimit(maxConcurrency);
    }

    private addPageVisit(normalizedUrl: string): boolean {
    if (this.shouldStop) return false;

    const count = Object.keys(this.pages).length;
    if (count >= this.maxPages) {
        this.shouldStop = true;
        console.log("Reached maximum number of pages to crawl.");
        this.abortController.abort();
        return false;
    }

    if (normalizedUrl in this.pages) return false;

    return true;
    }

    private async getHTML(url: string): Promise<string> {
        return this.limit(async () => {
            const response = await fetch(url, { signal: this.abortController.signal });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.text();
        });
    }

    private async crawlPage(currentURL: string): Promise<void> {
        if (this.shouldStop) return;

        //console.log("Crawling:", currentURL);

        const normalized = normalizeURL(currentURL);
        const isNew = this.addPageVisit(normalized);
        if (!isNew) return;

        let html: string;
        try {
            html = await this.getHTML(currentURL);
        } catch {
            return;
        }

        const pageData = this.extractPageData(html, currentURL);
        this.pages[normalized] = pageData;  

        const outgoing = pageData.outgoing_links;

        for (const nextUrl of outgoing) {
        if (this.shouldStop) break;

        const normalizedNext = normalizeURL(nextUrl);

        // Skip if already visited
        if (normalizedNext in this.pages) continue;

        // Skip if external
        if (!urlcheck(nextUrl)) continue;

        const task = this.crawlPage(nextUrl);
        this.allTasks.add(task);
        task.finally(() => this.allTasks.delete(task));
    }
    }

    public async crawl(): Promise<Record<string, ExtractedPageData>> {
        await this.crawlPage(this.baseUrl);
        await Promise.all(this.allTasks);
        return this.pages;
    }

    private extractPageData(html: string, pageURL: string): ExtractedPageData {
    const h1 = getH1fromHTML(html);
    const firstParagraph = getFirstParagraphFromHTML(html);
    const urls = this.getURLsFromHTML(html, this.baseUrl);
    const images = getImagesFromHTML(html, this.baseUrl);

    return {
        url: pageURL,
        h1,
        first_paragraph: firstParagraph,
        outgoing_links: urls,
        image_urls: images
    };
}

private getURLsFromHTML(html: string, baseURL: string): string[] {
    const dom = new JSDOM(html);
    const urls: string[] = [];

    dom.window.document.querySelectorAll("a").forEach(a => {
        const href = a.getAttribute("href");
        if (!href) return;

        try {
            const resolved = new URL(href, baseURL).href;
            urls.push(resolved);
        } catch {}
    });

    return urls;
}
}


if (import.meta.main) {
  main();
}
