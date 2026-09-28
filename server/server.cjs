const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const { promisify } = require("util");
const http = require("http");
const https = require("https");

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 3001;

// Auto-detect yt-dlp binary path
const YTDLP_BIN =
  process.env.YTDLP_PATH ||
  (process.platform === "darwin" && require("fs").existsSync("/opt/anaconda3/bin/yt-dlp")
    ? "/opt/anaconda3/bin/yt-dlp"
    : "yt-dlp");

app.use(cors({ origin: "*", methods: ["GET"] }));

// ── Search ────────────────────────────────────────────────────────────────────
app.get("/api/search", async (req, res) => {
  const q = String(req.query.q || "").trim();
  const limit = Math.min(parseInt(String(req.query.limit || "10")), 25);

  if (!q) return res.status(400).json({ error: "query required" });

  try {
    const cmd = `${YTDLP_BIN} "ytsearch${limit}:${q}" --print "%(id)s\t%(title)s\t%(uploader)s\t%(thumbnail)s\t%(duration)s" --no-download --flat-playlist 2>/dev/null`;
    const { stdout } = await execAsync(cmd, { timeout: 15000 });

    const results = stdout.trim().split("\n").filter(Boolean).map((line) => {
      const [id, title, uploader, thumbnail, duration] = line.split("\t");
      return {
        id: id || "",
        title: title || "Unknown",
        uploader: uploader || "Unknown Artist",
        thumbnail: thumbnail && thumbnail !== "NA" ? thumbnail : `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
        duration: parseInt(duration) || 0,
        durationFormatted: formatDuration(parseInt(duration) || 0),
      };
    });

    res.json({ results });
  } catch (err) {
    console.error("[search]", err.message);
    res.status(500).json({ error: "Search failed" });
  }
});

// ── Proxy stream ──────────────────────────────────────────────────────────────
app.get("/api/proxy", async (req, res) => {
  const id = String(req.query.id || "").trim();
  if (!id || !/^[a-zA-Z0-9_-]{11}$/.test(id)) {
    return res.status(400).json({ error: "invalid video id" });
  }

  try {
    const cmd = `${YTDLP_BIN} -g -f "bestaudio[ext=webm]/bestaudio[ext=m4a]/bestaudio" "https://youtube.com/watch?v=${id}" 2>/dev/null`;
    const { stdout } = await execAsync(cmd, { timeout: 20000 });
    const streamUrl = stdout.trim().split("\n")[0];

    if (!streamUrl) return res.status(404).send("Not found");

    const client = streamUrl.startsWith("https") ? https : http;
    const parsed = new URL(streamUrl);

    const proxyReq = client.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Referer: "https://www.youtube.com/",
        ...(req.headers.range ? { Range: req.headers.range } : {}),
      },
    }, (proxyRes) => {
      res.setHeader("Content-Type", proxyRes.headers["content-type"] || "audio/webm");
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Access-Control-Allow-Origin", "*");
      if (proxyRes.headers["content-length"]) res.setHeader("Content-Length", proxyRes.headers["content-length"]);
      if (proxyRes.headers["content-range"]) res.setHeader("Content-Range", proxyRes.headers["content-range"]);
      res.status(proxyRes.statusCode || 200);
      proxyRes.pipe(res);
    });

    proxyReq.on("error", (e) => { if (!res.headersSent) res.status(500).send("Proxy error"); });
    req.on("close", () => proxyReq.destroy());
    proxyReq.end();
  } catch (err) {
    console.error("[proxy]", err.message);
    if (!res.headersSent) res.status(500).send("Error");
  }
});

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/api/health", (_, res) => res.json({ ok: true }));

function formatDuration(s) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

app.listen(PORT, () => {
  console.log(`\n🎵 Spotify backend → http://localhost:${PORT}\n`);
});
