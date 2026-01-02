
export function normalizeURL(target_url:string) {
    console.log("Normalizing URL " + target_url);
    let working_URL:URL = new URL(target_url);
    let normalized_url:string = working_URL.hostname + working_URL.pathname;
    if (normalized_url.slice(-1) === "/") {
        normalized_url = normalized_url.slice(0, -1)
    };


    return normalized_url
}

