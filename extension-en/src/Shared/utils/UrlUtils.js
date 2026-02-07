/**
 * Detects the streaming service based on the URL.
 * @param {string} url - The URL to check.
 * @returns {string} The name of the streaming service or "Unknown".
 */
export function detectSourceFromUrl(url) {
    if (!url) return "Unknown";
    
    const sources = {
        "youtube.com": "YouTube",
        "netflix.com": "Netflix",
        "primevideo.com": "Amazon Prime Video",
        "disneyplus.com": "Disney+",
        "hbomax.com": "Max (HBO)",
        "starplus.com": "Star+"
    };
    
    for (const [domain, name] of Object.entries(sources)) {
        if (url.includes(domain)) return name;
    }
    
    return "Unknown";
}
