async function getOgImage(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    const html = await res.text();
    const match = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) || 
                  html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (match) {
      return match[1];
    }
  } catch (e) {
    console.log("Error fetching", url, e.message);
  }
  return '';
}
getOgImage('https://www.theverge.com/').then(console.log);
