/**
 * Detects the streaming service based on a URL.
 * @param {string} url
 * @returns {string}
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
    if (url.includes(domain)) {
      return name;
    }
  }

  try {
    const { hostname } = new URL(url);
    return hostname;
  } catch {
    return "Unknown";
  }
}
