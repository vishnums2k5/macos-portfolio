const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const { promisify } = require("util");
const http = require("http");
const https = require("https");

const execAsync = promisify(exec);
const app = express();
const PORT = 3001;

// CORS — allow Vite dev + Vercel domains
app.use(cors({
  origin: "*",
  methods: ["GET"],
}));

// ── Search ───────────────────────────────────────────────────────────────────
// GET /api/search?q=<query>&limit=<n>
app.get("/api/search", async (req, res) => {
  const q = String(req.query.q || "").trim();
  const limit = Math.min(parseInt(String(req.query.limit || "10")), 25);

  if (!q) return res.status(400).json({ error: "query required" });

  try {
    // Use yt-dlp flat search (no download, just metadata)
    const cmd = `/opt/anaconda3/bin/yt-dlp "ytsearch${limit}:${q}" --print "%(id)s\t%(title)s\t%(uploader)s\t%(thumbnail)s\t%(duration)s" --no-download --flat-playlist 2>/dev/null`;
    const { stdout } = await execAsync(cmd, { timeout: 15000 });

    const results = stdout.trim().split("\n").filter(Boolean).map((line) => {
      const parts = line.split("\t");
      const [id, title, uploader, thumbnail, duration] = parts;
      return {
        id: id || "",
        title: title || "Unknown",
        uploader: uploader || "Unknown Artist",
        thumbnail: (thumbnail && thumbnail !== "NA") ? thumbnail : `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
        duration: parseInt(duration) || 0,
        durationFormatted: formatDuration(parseInt(duration) || 0),
      };
    });

    res.json({ results });
  } catch (err) {
    console.error("[search] error:", err.message);
    res.status(500).json({ error: "Search failed" });
  }
});

// ── Stream URL ────────────────────────────────────────────────────────────────
// GET /api/stream?id=<youtubeId>
app.get("/api/stream", async (req, res) => {
  const id = String(req.query.id || "").trim();

  if (!id || !/^[a-zA-Z0-9_-]{11}$/.test(id)) {
    return res.status(400).json({ error: "invalid video id" });
  }

  try {
    const cmd = `/opt/anaconda3/bin/yt-dlp -g -f "bestaudio[ext=webm]/bestaudio[ext=m4a]/bestaudio" "https://youtube.com/watch?v=${id}" 2>/dev/null`;
    const { stdout } = await execAsync(cmd, { timeout: 20000 });
    const streamUrl = stdout.trim().split("\n")[0];

    if (!streamUrl) return res.status(404).json({ error: "No audio found" });

    res.json({ url: streamUrl, id });
  } catch (err) {
    console.error("[stream] error:", err.message);
    res.status(500).json({ error: "Stream fetch failed" });
  }
});

// ── Proxy stream (avoids CORS on googlevideo) ─────────────────────────────────
// GET /api/proxy?id=<youtubeId>
app.get("/api/proxy", async (req, res) => {
  const id = String(req.query.id || "").trim();

  if (!id || !/^[a-zA-Z0-9_-]{11}$/.test(id)) {
    return res.status(400).json({ error: "invalid video id" });
  }

  try {
    const cmd = `/opt/anaconda3/bin/yt-dlp -g -f "bestaudio[ext=webm]/bestaudio[ext=m4a]/bestaudio" "https://youtube.com/watch?v=${id}" 2>/dev/null`;
    const { stdout } = await execAsync(cmd, { timeout: 20000 });
    const streamUrl = stdout.trim().split("\n")[0];

    if (!streamUrl) return res.status(404).send("Not found");

    // Stream through our server to avoid CORS/auth issues
    const client = streamUrl.startsWith("https") ? https : http;

    const options = new URL(streamUrl);
    const range = req.headers.range;

    const proxyReq = client.request(
      {
        hostname: options.hostname,
        path: options.pathname + options.search,
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          Referer: "https://www.youtube.com/",
          ...(range ? { Range: range } : {}),
        },
      },
      (proxyRes) => {
        res.setHeader("Content-Type", proxyRes.headers["content-type"] || "audio/webm");
        res.setHeader("Accept-Ranges", "bytes");
        res.setHeader("Access-Control-Allow-Origin", "*");

        if (proxyRes.headers["content-length"])
          res.setHeader("Content-Length", proxyRes.headers["content-length"]);
        if (proxyRes.headers["content-range"])
          res.setHeader("Content-Range", proxyRes.headers["content-range"]);

        res.status(proxyRes.statusCode || 200);
        proxyRes.pipe(res);
      }
    );

    proxyReq.on("error", (err) => {
      console.error("[proxy] request error:", err.message);
      if (!res.headersSent) res.status(500).send("Proxy error");
    });

    req.on("close", () => proxyReq.destroy());
    proxyReq.end();
  } catch (err) {
    console.error("[proxy] error:", err.message);
    if (!res.headersSent) res.status(500).send("Proxy error");
  }
});

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/api/health", (_, res) => res.json({ ok: true }));

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

app.listen(PORT, () => {
  console.log(`\n🎵 Spotify backend ready at http://localhost:${PORT}`);
  console.log(`   Search: http://localhost:${PORT}/api/search?q=lofi`);
  console.log(`   Proxy:  http://localhost:${PORT}/api/proxy?id=wEWF2xh5E8s\n`);
});
