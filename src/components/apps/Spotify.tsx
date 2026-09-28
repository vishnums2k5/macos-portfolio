import React, { useState, useRef, useEffect, useCallback } from "react";

// ── Dynamic API Resolution ──────────────────────────────────────────────────
const DEFAULT_API =
  import.meta.env.VITE_SPOTIFY_API_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:3001/api"
    : "https://spotify-backend-vvyn.onrender.com/api");

function getStoredApi(): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("spotify_backend_url");
    if (saved) return saved.replace(/\/+$/, "").replace(/\/api$/, "") + "/api";
  }
  return DEFAULT_API;
}
const accent = "#1DB954";
const accentDark = "#158f3e";
const bg = "#121212";
const sidebar = "#000000";
const card = "#181818";
const cardHover = "#282828";
const text = "#FFFFFF";
const muted = "#B3B3B3";
const mutedDark = "#535353";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Track {
  id: string;
  title: string;
  uploader: string;
  thumbnail: string;
  duration: number;
  durationFormatted: string;
}

interface PlayerState {
  track: Track | null;
  playing: boolean;
  progress: number; // 0..1
  elapsed: number;  // seconds
  volume: number;   // 0..1
  loading: boolean;
  error: string | null;
}

// ── Playlists / featured (sidebar data) ───────────────────────────────────────
const PLAYLISTS = [
  { id: "p1", name: "Liked Songs", color: "#6c47b7", initial: "♥", desc: "Playlist • 42 songs" },
  { id: "p2", name: "My Playlist #6", color: "#3a3a5c", initial: "#6", desc: "Playlist • Vishnu" },
  { id: "p3", name: "Lofi Chill", color: "#2d7a4f", initial: "L", desc: "Playlist • Vishnu" },
  { id: "p4", name: "Dev Mode", color: "#b7471c", initial: "D", desc: "Playlist • Vishnu" },
  { id: "p5", name: "GuideRealm", color: "#1a7a47", initial: "GR", desc: "Playlist • Vishnu" },
  { id: "p6", name: "Focus Flow", color: "#1c4db7", initial: "FF", desc: "Playlist • Vishnu" },
  { id: "p7", name: "Night Coding", color: "#7a1a1a", initial: "NC", desc: "Playlist • Vishnu" },
];

const FEATURED: Track[] = [
  { id: "wEWF2xh5E8s", title: "Sadness and Sorrow (Full Version)", uploader: "Naruto Soundtrack", thumbnail: "https://img.youtube.com/vi/wEWF2xh5E8s/hqdefault.jpg", duration: 439, durationFormatted: "7:19" },
  { id: "jgpJVI3tDbY", title: "Opening 1 – Hero's Come Back!", uploader: "Naruto Shippuden", thumbnail: "https://img.youtube.com/vi/jgpJVI3tDbY/hqdefault.jpg", duration: 225, durationFormatted: "3:45" },
  { id: "Fj6-3pJi8bM", title: "Lofi Chill – Study Beats", uploader: "Lofi Girl", thumbnail: "https://img.youtube.com/vi/Fj6-3pJi8bM/hqdefault.jpg", duration: 3600, durationFormatted: "60:00" },
  { id: "lFcSrYw2ARY", title: "Interstellar Main Theme", uploader: "Hans Zimmer", thumbnail: "https://img.youtube.com/vi/lFcSrYw2ARY/hqdefault.jpg", duration: 395, durationFormatted: "6:35" },
];

// ── Helper ─────────────────────────────────────────────────────────────────────
function fmtTime(s: number) {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function Spotify() {
  const [view, setView] = useState<"home" | "search">("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [player, setPlayer] = useState<PlayerState>({
    track: null,
    playing: false,
    progress: 0,
    elapsed: 0,
    volume: 0.8,
    loading: false,
    error: null,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Audio events ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = new Audio();
    audio.volume = player.volume;
    audioRef.current = audio;

    const onTimeUpdate = () => {
      if (!audio.duration) return;
      setPlayer((p) => ({
        ...p,
        elapsed: audio.currentTime,
        progress: audio.currentTime / audio.duration,
      }));
    };
    const onEnded = () => setPlayer((p) => ({ ...p, playing: false, progress: 0, elapsed: 0 }));
    const onCanPlay = () => setPlayer((p) => ({ ...p, loading: false }));
    const onError = () => setPlayer((p) => ({ ...p, loading: false, error: "Playback error — try another track" }));

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("error", onError);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("error", onError);
    };
  }, []);

  // ── Play track ────────────────────────────────────────────────────────────────
  const playTrack = useCallback(async (track: Track) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    setPlayer((p) => ({ ...p, track, playing: false, loading: true, error: null, progress: 0, elapsed: 0 }));

    try {
      // Use proxy endpoint from configured backend
      const baseApi = getStoredApi();
      audio.src = `${baseApi}/proxy?id=${track.id}`;
      audio.volume = player.volume;
      await audio.play();
      setPlayer((p) => ({ ...p, playing: true, loading: false }));
    } catch (err: any) {
      setPlayer((p) => ({
        ...p,
        loading: false,
        error: `Playback error: backend unreachable. Ensure your Render backend or local server is running.`,
      }));
    }
  }, [player.volume]);

  // ── Play/Pause ────────────────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !player.track) return;
    if (player.playing) {
      audio.pause();
      setPlayer((p) => ({ ...p, playing: false }));
    } else {
      audio.play().then(() => setPlayer((p) => ({ ...p, playing: true })));
    }
  }, [player.playing, player.track]);

  // ── Seek ──────────────────────────────────────────────────────────────────────
  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressRef.current;
    const audio = audioRef.current;
    if (!bar || !audio || !audio.duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;
    setPlayer((p) => ({ ...p, progress: ratio, elapsed: ratio * audio.duration }));
  }, []);

  // ── Volume ────────────────────────────────────────────────────────────────────
  const setVolume = useCallback((v: number) => {
    if (audioRef.current) audioRef.current.volume = v;
    setPlayer((p) => ({ ...p, volume: v }));
  }, []);

  // ── Search (debounced) ────────────────────────────────────────────────────────
  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    setSearchError(null);
    try {
      const baseApi = getStoredApi();
      const res = await fetch(`${baseApi}/search?q=${encodeURIComponent(q)}&limit=12`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch {
      setSearchError("Search failed — check backend URL or ensure Render service is awake");
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const onQueryChange = (q: string) => {
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => handleSearch(q), 500);
  };

  // ── Duration text ─────────────────────────────────────────────────────────────
  const totalDuration = player.track?.duration || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", fontFamily: "'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif", backgroundColor: bg, color: text, overflow: "hidden", borderRadius: "inherit" }}>
      {/* ── Main body (sidebar + content) ──────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Left Sidebar ─────────────────────────────────────────────────── */}
        <div style={{ width: "280px", minWidth: "220px", backgroundColor: sidebar, display: "flex", flexDirection: "column", borderRight: "1px solid rgba(255,255,255,0.06)", flexShrink: 0, overflow: "hidden" }}>

          {/* Nav */}
          <div style={{ padding: "16px 12px 8px" }}>
            <div
              onClick={() => setView("home")}
              style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", color: view === "home" ? text : muted, fontWeight: 700, fontSize: "15px" }}
            >
              <span style={{ fontSize: "20px" }}>🏠</span> Home
            </div>
            <div
              onClick={() => { setView("search"); }}
              style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", color: view === "search" ? text : muted, fontWeight: 700, fontSize: "15px" }}
            >
              <span style={{ fontSize: "20px" }}>🔍</span> Search
            </div>
          </div>

          {/* Your Library */}
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", padding: "0 8px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 8px 12px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "10px", color: muted, fontWeight: 700, fontSize: "13px" }}>
                <span>📚</span> Your Library
              </span>
              <span style={{ fontSize: "22px", color: muted, cursor: "pointer" }}>+</span>
            </div>

            {/* Library search */}
            <div style={{ padding: "0 4px 10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.08)", borderRadius: "6px", padding: "6px 10px" }}>
                <span style={{ fontSize: "13px", opacity: 0.6 }}>🔍</span>
                <input
                  placeholder="Search in Your Library"
                  style={{ background: "none", border: "none", outline: "none", color: text, fontSize: "12px", width: "100%" }}
                  readOnly
                />
              </div>
            </div>

            {/* Playlist list */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {PLAYLISTS.map((pl) => (
                <div
                  key={pl.id}
                  style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "6px", cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ width: "42px", height: "42px", borderRadius: "6px", background: pl.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, flexShrink: 0 }}>
                    {pl.initial}
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: text }}>{pl.name}</div>
                    <div style={{ fontSize: "11px", color: muted }}>{pl.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main Content ──────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "linear-gradient(180deg, #1a1a2e 0%, #121212 300px)" }}>

          {/* Top bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", flexShrink: 0 }}>
            <div style={{ display: "flex", gap: "8px" }}>
              {["◀", "▶"].map((a) => (
                <button key={a} style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "none", color: text, cursor: "pointer", fontSize: "13px" }}>{a}</button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "20px", padding: "4px 12px", fontSize: "12px", fontWeight: 700 }}>🔔 Premium Active</div>
              <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700 }}>V</div>
              <span style={{ fontSize: "13px", fontWeight: 700 }}>Vishnu M S</span>
            </div>
          </div>

          {/* ─ Scrollable area ─ */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 20px" }}>

            {view === "home" && (
              <>
                <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 24px" }}>Welcome Back</h1>

                {/* Favorites pill */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px", background: "rgba(255,255,255,0.08)", borderRadius: "6px", padding: "10px 16px", marginBottom: "32px", cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}>
                  <div style={{ width: "48px", height: "48px", background: "linear-gradient(135deg, #6c47b7, #1DB954)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>❤️</div>
                  <span style={{ fontSize: "15px", fontWeight: 700 }}>Favorites</span>
                </div>

                {/* Featured / Vishnu's Favorites */}
                <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 18px" }}>Vishnu's Favorites</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "18px" }}>
                  {FEATURED.map((track) => (
                    <TrackCard key={track.id} track={track} playing={player.track?.id === track.id && player.playing} onPlay={() => playTrack(track)} />
                  ))}
                </div>
              </>
            )}

            {view === "search" && (
              <>
                <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 18px" }}>Search</h1>

                {/* Search input */}
                <div style={{ position: "relative", marginBottom: "28px" }}>
                  <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "16px", pointerEvents: "none" }}>🔍</span>
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => onQueryChange(e.target.value)}
                    placeholder="What do you want to listen to?"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "13px 16px 13px 44px",
                      borderRadius: "30px",
                      background: "#2a2a2a",
                      border: "none",
                      outline: "none",
                      color: text,
                      fontSize: "15px",
                    }}
                  />
                </div>

                {/* Loading */}
                {searching && (
                  <div style={{ textAlign: "center", padding: "32px", color: muted }}>
                    <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
                    Searching YouTube...
                  </div>
                )}

                {/* Error */}
                {searchError && (
                  <div style={{ background: "rgba(255,0,0,0.1)", borderRadius: "8px", padding: "16px", color: "#ff6b6b", fontSize: "13px", marginBottom: "16px" }}>
                    ⚠️ {searchError}
                  </div>
                )}

                {/* Results */}
                {!searching && searchResults.length > 0 && (
                  <>
                    <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 16px" }}>Results</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      {searchResults.map((track, i) => (
                        <SearchResultRow
                          key={track.id}
                          track={track}
                          index={i + 1}
                          playing={player.track?.id === track.id && player.playing}
                          onPlay={() => playTrack(track)}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Empty state */}
                {!searching && !searchResults.length && searchQuery && !searchError && (
                  <div style={{ textAlign: "center", padding: "48px", color: muted }}>
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎵</div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: text, marginBottom: "8px" }}>No results for "{searchQuery}"</div>
                    <div style={{ fontSize: "13px" }}>Try different keywords or check your spelling.</div>
                  </div>
                )}

                {/* Initial search prompt */}
                {!searching && !searchQuery && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px" }}>
                    {["Lofi", "Naruto OST", "Hans Zimmer", "Coding Music", "Anime", "Chill Beats", "Jazz", "EDM"].map((genre, i) => {
                      const colors = ["#E8115B","#1E3264","#8D67AB","#1DB954","#BA5D07","#148A08","#E91429","#509BF5"];
                      return (
                        <div
                          key={genre}
                          onClick={() => { onQueryChange(genre); }}
                          style={{ background: colors[i], borderRadius: "8px", padding: "16px", cursor: "pointer", fontWeight: 700, fontSize: "14px", minHeight: "80px", display: "flex", alignItems: "flex-end" }}
                        >
                          {genre}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Player Bar ─────────────────────────────────────────────────────────── */}
      <PlayerBar
        player={player}
        totalDuration={totalDuration}
        onTogglePlay={togglePlay}
        onSeek={seek}
        onVolume={setVolume}
        progressRef={progressRef}
      />
    </div>
  );
}

// ─── Track Card (Home grid) ────────────────────────────────────────────────────
function TrackCard({ track, playing, onPlay }: { track: Track; playing: boolean; onPlay: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onPlay}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? cardHover : card,
        borderRadius: "8px",
        padding: "14px",
        cursor: "pointer",
        transition: "background 0.2s",
        position: "relative",
      }}
    >
      <div style={{ position: "relative", marginBottom: "12px" }}>
        <img
          src={track.thumbnail}
          alt={track.title}
          style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: "6px", display: "block" }}
          onError={(e) => { (e.target as HTMLImageElement).src = "https://img.youtube.com/vi/default/hqdefault.jpg"; }}
        />
        {hovered && (
          <div style={{ position: "absolute", bottom: "8px", right: "8px", width: "42px", height: "42px", borderRadius: "50%", background: accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.5)", transition: "opacity 0.2s" }}>
            {playing ? "⏸" : "▶"}
          </div>
        )}
        {playing && !hovered && (
          <div style={{ position: "absolute", bottom: "8px", right: "8px", width: "42px", height: "42px", borderRadius: "50%", background: accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
            ▶
          </div>
        )}
      </div>
      <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</div>
      <div style={{ fontSize: "11px", color: muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>By {track.uploader}</div>
      {/* "VISHNU'S FAVORITE" badge */}
      <div style={{ position: "absolute", top: "20px", left: "20px", background: accent, borderRadius: "2px", padding: "2px 6px", fontSize: "9px", fontWeight: 800, letterSpacing: "0.5px" }}>
        VISHNU'S FAVORITE
      </div>
    </div>
  );
}

// ─── Search Result Row ────────────────────────────────────────────────────────
function SearchResultRow({ track, index, playing, onPlay }: { track: Track; index: number; playing: boolean; onPlay: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onPlay}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "32px 48px 1fr auto",
        alignItems: "center",
        gap: "12px",
        padding: "6px 8px",
        borderRadius: "6px",
        cursor: "pointer",
        background: hovered ? "rgba(255,255,255,0.07)" : "transparent",
        transition: "background 0.15s",
      }}
    >
      {/* Index / play icon */}
      <div style={{ textAlign: "center", fontSize: "13px", color: playing ? accent : muted, fontWeight: playing ? 700 : 400 }}>
        {hovered || playing ? (playing ? "▶" : "▶") : index}
      </div>

      {/* Thumbnail */}
      <img
        src={track.thumbnail}
        alt={track.title}
        style={{ width: "48px", height: "48px", borderRadius: "4px", objectFit: "cover" }}
        onError={(e) => { (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${track.id}/default.jpg`; }}
      />

      {/* Title + artist */}
      <div>
        <div style={{ fontSize: "14px", fontWeight: 600, color: playing ? accent : text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "240px" }}>{track.title}</div>
        <div style={{ fontSize: "12px", color: muted }}>{track.uploader}</div>
      </div>

      {/* Duration */}
      <div style={{ fontSize: "12px", color: muted, paddingRight: "8px" }}>{track.durationFormatted}</div>
    </div>
  );
}

// ─── Player Bar ───────────────────────────────────────────────────────────────
function PlayerBar({
  player, totalDuration, onTogglePlay, onSeek, onVolume, progressRef,
}: {
  player: PlayerState;
  totalDuration: number;
  onTogglePlay: () => void;
  onSeek: (e: React.MouseEvent<HTMLDivElement>) => void;
  onVolume: (v: number) => void;
  progressRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div style={{ height: "84px", background: "#181818", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", padding: "0 16px", gap: "12px", flexShrink: 0 }}>

      {/* Now playing info */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "240px", flexShrink: 0 }}>
        {player.track ? (
          <>
            <img src={player.track.thumbnail} alt="" style={{ width: "56px", height: "56px", borderRadius: "4px", objectFit: "cover", flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${player.track?.id}/default.jpg`; }} />
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{player.track.title}</div>
              <div style={{ fontSize: "11px", color: muted }}>{player.track.uploader}</div>
            </div>
            <span style={{ color: accent, fontSize: "14px", flexShrink: 0, marginLeft: "4px" }}>♥</span>
          </>
        ) : (
          <div style={{ color: mutedDark, fontSize: "12px" }}>Nothing playing</div>
        )}
      </div>

      {/* Center controls + progress */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <CtrlBtn label="⇄" title="Shuffle" />
          <CtrlBtn label="⏮" title="Previous" />
          <button
            onClick={onTogglePlay}
            disabled={!player.track}
            title={player.playing ? "Pause" : "Play"}
            style={{
              width: "36px", height: "36px", borderRadius: "50%",
              background: player.track ? text : mutedDark,
              border: "none", cursor: player.track ? "pointer" : "default",
              fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "transform 0.1s",
            }}
          >
            {player.loading ? "⏳" : player.playing ? "⏸" : "▶"}
          </button>
          <CtrlBtn label="⏭" title="Next" />
          <CtrlBtn label="↺" title="Repeat" />
        </div>

        {/* Progress bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", maxWidth: "520px" }}>
          <span style={{ fontSize: "11px", color: muted, minWidth: "36px", textAlign: "right" }}>{fmtTime(player.elapsed)}</span>
          <div
            ref={progressRef}
            onClick={onSeek}
            style={{ flex: 1, height: "4px", background: mutedDark, borderRadius: "2px", cursor: "pointer", position: "relative" }}
          >
            <div style={{ width: `${player.progress * 100}%`, height: "100%", background: player.track ? accent : mutedDark, borderRadius: "2px", transition: "width 0.1s linear" }} />
          </div>
          <span style={{ fontSize: "11px", color: muted, minWidth: "36px" }}>{fmtTime(totalDuration)}</span>
        </div>

        {/* Error */}
        {player.error && (
          <div style={{ fontSize: "10px", color: "#ff6b6b", textAlign: "center" }}>{player.error}</div>
        )}
      </div>

      {/* Volume */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "140px", justifyContent: "flex-end", flexShrink: 0 }}>
        <span style={{ fontSize: "14px", cursor: "pointer" }} onClick={() => onVolume(player.volume > 0 ? 0 : 0.8)}>
          {player.volume === 0 ? "🔇" : player.volume < 0.5 ? "🔉" : "🔊"}
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={player.volume}
          onChange={(e) => onVolume(parseFloat(e.target.value))}
          style={{ width: "90px", accentColor: accent, cursor: "pointer" }}
        />
      </div>
    </div>
  );
}

function CtrlBtn({ label, title }: { label: string; title: string }) {
  return (
    <button title={title} style={{ background: "none", border: "none", color: muted, cursor: "pointer", fontSize: "16px", padding: "4px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {label}
    </button>
  );
}