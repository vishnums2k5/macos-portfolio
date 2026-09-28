export default async function handler(req, res) {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: "Missing query parameter" });

  try {
    const response = await fetch(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(q + " official audio")}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      }
    );

    const html = await response.text();

    // YouTube embeds initial data as JSON — extract all videoIds from it
    const matches = [...html.matchAll(/"videoId":"([\w-]{11})"/g)];
    const ids = [...new Set(matches.map((m) => m[1]))];

    if (ids.length > 0) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
      return res.status(200).json({ videoId: ids[0], candidates: ids.slice(0, 5) });
    }

    return res.status(404).json({ error: "No video results found" });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
