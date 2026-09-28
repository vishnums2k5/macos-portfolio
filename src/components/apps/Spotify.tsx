import React, { useState, useRef, useCallback, useEffect } from "react";
import { useAudioContext } from "~/context/AudioContext";

// ── Extend Window for YouTube IFrame API ───────────────────────────────────────
declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface Track {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration?: string;
  durationSec?: number;
  badge?: string;
  youtubeQuery?: string; // search query for YouTube
  youtubeId?: string;    // direct video ID (for curated tracks)
}

// ── Curated Tracks with direct YouTube IDs (instant, no search needed) ──────
const FEATURED_TRACKS: Track[] = [
  {
    id: "wEWF2xh5E8s",
    youtubeId: "wEWF2xh5E8s",
    title: "Sadness and Sorrow",
    artist: "Naruto Soundtrack",
    badge: "VISHNU'S FAVORITE",
    thumbnail: "https://img.youtube.com/vi/wEWF2xh5E8s/hqdefault.jpg",
    duration: "7:19",
  },
  {
    id: "jgpJVI3tDbY",
    youtubeId: "jgpJVI3tDbY",
    title: "Hero's Come Back (Opening 1)",
    artist: "Naruto Shippuden",
    badge: "VISHNU'S FAVORITE",
    thumbnail: "https://img.youtube.com/vi/jgpJVI3tDbY/hqdefault.jpg",
    duration: "3:45",
  },
  {
    id: "jfKfPfyJRdk",
    youtubeId: "jfKfPfyJRdk",
    title: "Lofi Hip Hop – Relaxing Beats",
    artist: "Lofi Girl",
    badge: "CODING ESSENTIAL",
    thumbnail: "https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg",
    duration: "LIVE",
  },
  {
    id: "UDVtMYqUAyw",
    youtubeId: "UDVtMYqUAyw",
    title: "Interstellar Main Theme",
    artist: "Hans Zimmer",
    badge: "MASTERPIECE",
    thumbnail: "https://img.youtube.com/vi/UDVtMYqUAyw/hqdefault.jpg",
    duration: "4:08",
  },
  {
    id: "34Na4j8AVgA",
    youtubeId: "34Na4j8AVgA",
    title: "Starboy",
    artist: "The Weeknd ft. Daft Punk",
    badge: "POPULAR",
    thumbnail: "https://img.youtube.com/vi/34Na4j8AVgA/hqdefault.jpg",
    duration: "3:50",
  },
  {
    id: "sFlrn1fW0i8",
    youtubeId: "sFlrn1fW0i8",
    title: "GigaChad Theme (Phonk Remix)",
    artist: "g3ox_em",
    badge: "DEV MODE",
    thumbnail: "https://img.youtube.com/vi/sFlrn1fW0i8/hqdefault.jpg",
    duration: "2:24",
  },
];

const PLAYLISTS = [
  { id: "p1", name: "Liked Songs", color: "#6c47b7", initial: "♥", desc: "Playlist • 42 songs" },
  { id: "p2", name: "My Playlist #6", color: "#3a3a5c", initial: "#6", desc: "Playlist • Vishnu" },
  { id: "p3", name: "Lofi Chill", color: "#2d7a4f", initial: "L", desc: "Playlist • Vishnu" },
  { id: "p4", name: "Dev Mode", color: "#b7471c", initial: "D", desc: "Playlist • Vishnu" },
  { id: "p5", name: "GuideRealm", color: "#1a7a47", initial: "GR", desc: "Playlist • Vishnu" },
  { id: "p6", name: "Focus Flow", color: "#1c4db7", initial: "FF", desc: "Playlist • Vishnu" },
  { id: "p7", name: "Night Coding", color: "#7a1a1a", initial: "NC", desc: "Playlist • Vishnu" },
];

const GENRES = [
  { name: "Popular Hits", query: "popular hits 2024", color: "#E8115B" },
  { name: "The Weeknd", query: "the weeknd blinding lights", color: "#148A08" },
  { name: "Lofi Chill", query: "lofi hip hop beats study", color: "#BA5D07" },
  { name: "Naruto OST", query: "naruto sadness sorrow soundtrack", color: "#1E3264" },
  { name: "Hans Zimmer", query: "hans zimmer interstellar", color: "#8D67AB" },
  { name: "Anime Hits", query: "best anime openings 2024", color: "#1DB954" },
  { name: "Synthwave", query: "synthwave retrowave 80s", color: "#E91429" },
  { name: "A.R. Rahman", query: "ar rahman best hits", color: "#509BF5" },
];

function fmtTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ── YouTube Player States ──────────────────────────────────────────────────────
const YT_STATE = { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 };

export default function Spotify() {
  const { controls: audioCtrl } = useAudioContext();

  const [view, setView] = useState<"home" | "search">("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [videoExpanded, setVideoExpanded] = useState(false);
  const [liked, setLiked] = useState(true);

  // Current track state managed locally (YouTube drives audio)
  const [currentTrack, setCurrentTrack] = useState<Track>(FEATURED_TRACKS[0]);
  const [ytPlaying, setYtPlaying] = useState(false);
  const [ytTime, setYtTime] = useState(0);
  const [ytDuration, setYtDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const [ytReady, setYtReady] = useState(false);

  const ytPlayerRef = useRef<any>(null);
  const ytContainerRef = useRef<HTMLDivElement>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load YouTube IFrame API ──────────────────────────────────────────────────
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      initPlayer();
      return;
    }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);

    window.onYouTubeIframeAPIReady = () => {
      initPlayer();
    };

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  const initPlayer = () => {
    if (!ytContainerRef.current || ytPlayerRef.current) return;

    ytPlayerRef.current = new window.YT.Player(ytContainerRef.current, {
      height: "100%",
      width: "100%",
      videoId: FEATURED_TRACKS[0].youtubeId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        rel: 0,
        modestbranding: 1,
        iv_load_policy: 3,
        playsinline: 1,
      },
      events: {
        onReady: () => {
          setYtReady(true);
        },
        onStateChange: (event: any) => {
          const state = event.data;
          if (state === YT_STATE.PLAYING) {
            setYtPlaying(true);
            startTick();
          } else if (state === YT_STATE.PAUSED || state === YT_STATE.ENDED) {
            setYtPlaying(false);
            stopTick();
          } else if (state === YT_STATE.BUFFERING) {
            // keep showing playing state
          }
        },
      },
    });
  };

  const startTick = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      const p = ytPlayerRef.current;
      if (!p || !p.getCurrentTime) return;
      try {
        const cur = p.getCurrentTime() || 0;
        const dur = p.getDuration() || 0;
        setYtTime(cur);
        if (dur > 0) setYtDuration(dur);
      } catch (_) {}
    }, 500);
  };

  const stopTick = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  // ── Resolve YouTube video ID via Vercel serverless function ──────────────────
  const resolveAndPlay = useCallback(
    async (track: Track) => {
      const query = track.youtubeQuery || `${track.title} ${track.artist}`;
      try {
        const res = await fetch(`/api/yt-search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          const videoId: string = data.videoId;
          if (videoId && ytPlayerRef.current) {
            ytPlayerRef.current.loadVideoById({ videoId, startSeconds: 0 });
            return;
          }
        }
      } catch (_) {}
      // fallback: still try loadPlaylist search
      try {
        ytPlayerRef.current?.loadPlaylist({ listType: "search", list: query });
      } catch (_) {}
    },
    []
  );

  // ── Play a track ──────────────────────────────────────────────────────────────
  const playTrack = useCallback(
    (track: Track) => {
      setCurrentTrack(track);
      setYtTime(0);
      setYtDuration(0);
      setLiked(true);

      // Sync to global AudioContext so Control Center + Dynamic Island update
      audioCtrl.setSong(
        {
          title: track.title,
          artist: track.artist,
          cover: track.thumbnail,
          src: "",
          youtubeId: track.youtubeId,
        },
        false
      );

      const p = ytPlayerRef.current;
      if (!p) return;

      if (track.youtubeId) {
        // Direct video ID — instant, no lookup needed
        p.loadVideoById({ videoId: track.youtubeId, startSeconds: 0 });
      } else {
        // Search result — fetch real video ID from our Vercel API, then play
        resolveAndPlay(track);
      }
    },
    [audioCtrl, resolveAndPlay]
  );

  // ── Timeline scrub ────────────────────────────────────────────────────────────
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDragTime(parseFloat(e.target.value));
    if (!isDragging) setIsDragging(true);
  };

  const handleSeekCommit = () => {
    setIsDragging(false);
    const p = ytPlayerRef.current;
    if (p && p.seekTo) {
      p.seekTo(dragTime, true);
      setYtTime(dragTime);
    }
  };

  const togglePlay = () => {
    const p = ytPlayerRef.current;
    if (!p) return;
    if (ytPlaying) {
      p.pauseVideo();
    } else {
      if (ytReady) p.playVideo();
    }
  };

  const displayTime = isDragging ? dragTime : ytTime;
  const duration = ytDuration > 0 ? ytDuration : 0;
  const progressPct = duration > 0 ? Math.min(100, (displayTime / duration) * 100) : 0;

  // ── Search (iTunes API for metadata + artwork, YouTube plays full song) ───────
  const performSearch = useCallback(async (query: string) => {
    const q = query.trim();
    if (!q) { setSearchResults([]); setIsSearching(false); return; }

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=12`
      );
      const data = await res.json();

      if (data.results?.length > 0) {
        const formatted: Track[] = data.results.map((r: any) => {
          const art = r.artworkUrl100?.replace("100x100bb.jpg", "600x600bb.jpg") ?? "";
          const durSec = Math.floor((r.trackTimeMillis || 0) / 1000);
          return {
            id: String(r.trackId),
            title: r.trackName,
            artist: r.artistName,
            thumbnail: art,
            duration: fmtTime(durSec),
            durationSec: durSec,
            // YouTube will search: "Track Name Artist official audio"
            youtubeQuery: `${r.trackName} ${r.artistName} official audio`,
          };
        });
        setSearchResults(formatted);
      } else {
        setSearchResults([]);
      }
    } catch (_) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleQueryChange = (val: string) => {
    setSearchQuery(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => performSearch(val), 350);
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        fontFamily: "'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
        backgroundColor: "#121212",
        color: "#FFFFFF",
        overflow: "hidden",
        borderRadius: "inherit",
      }}
    >
      {/* ── Hidden YouTube Player (always present, drives all audio) ── */}
      <div
        style={{
          position: "absolute",
          width: videoExpanded ? "0" : "1px",
          height: videoExpanded ? "0" : "1px",
          opacity: 0.01,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <div ref={ytContainerRef} style={{ width: "1px", height: "1px" }} />
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* ── Left Sidebar ── */}
        <div
          style={{
            width: "260px",
            minWidth: "200px",
            backgroundColor: "#000",
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
          }}
        >
          <div style={{ padding: "16px 12px 8px" }}>
            {(["home", "search"] as const).map((v) => (
              <div
                key={v}
                onClick={() => setView(v)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 14px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  color: view === v ? "#FFFFFF" : "#B3B3B3",
                  fontWeight: 700,
                  fontSize: "15px",
                  backgroundColor: view === v ? "rgba(255,255,255,0.08)" : "transparent",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{v === "home" ? "🏠" : "🔍"}</span>
                {v === "home" ? "Home" : "Search"}
              </div>
            ))}
          </div>

          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", padding: "0 8px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 10px 8px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "10px", color: "#B3B3B3", fontWeight: 700, fontSize: "13px" }}>
                <span>📚</span> Your Library
              </span>
              <span style={{ fontSize: "20px", color: "#B3B3B3", cursor: "pointer" }}>+</span>
            </div>
            <div style={{ flex: 1, overflowY: "auto", paddingBottom: "10px" }}>
              {PLAYLISTS.map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => { setView("home"); playTrack(FEATURED_TRACKS[0]); }}
                  style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 10px", borderRadius: "6px", cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ width: "42px", height: "42px", borderRadius: "6px", background: pl.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, flexShrink: 0 }}>
                    {pl.initial}
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>{pl.name}</div>
                    <div style={{ fontSize: "11px", color: "#B3B3B3" }}>{pl.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main Content ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "linear-gradient(180deg, #1e1e38 0%, #121212 320px)" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", flexShrink: 0 }}>
            <div style={{ display: "flex", gap: "8px" }}>
              {(["◀", "▶"] as const).map((btn, i) => (
                <button key={btn} onClick={() => setView(i === 0 ? "home" : "search")}
                  style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none", color: "#FFF", cursor: "pointer", fontSize: "13px" }}>
                  {btn}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button onClick={() => setVideoExpanded(!videoExpanded)}
                style={{ background: videoExpanded ? "#1DB954" : "rgba(255,255,255,0.12)", color: videoExpanded ? "#000" : "#FFF", border: "none", borderRadius: "20px", padding: "6px 14px", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }}>
                <span>📺</span> {videoExpanded ? "Hide Video" : "Video Visualizer"}
              </button>
              <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "20px", padding: "6px 14px", fontSize: "12px", fontWeight: 700 }}>🔔 Premium Active</div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(0,0,0,0.4)", padding: "4px 10px 4px 4px", borderRadius: "20px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#1DB954", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 800, color: "#000" }}>V</div>
                <span style={{ fontSize: "13px", fontWeight: 700 }}>Vishnu M S</span>
              </div>
            </div>
          </div>

          {/* Scroll Area */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 24px" }}>
            {/* ── Expanded YouTube Video Player ── */}
            {videoExpanded && (
              <div style={{ marginBottom: "24px", borderRadius: "12px", overflow: "hidden", background: "#000", aspectRatio: "16/9", maxHeight: "340px", width: "100%", position: "relative" }}>
                <div ref={videoExpanded ? ytContainerRef : undefined} style={{ width: "100%", height: "100%" }} />
              </div>
            )}

            {/* ── HOME VIEW ── */}
            {view === "home" && (
              <>
                <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 20px" }}>Welcome Back</h1>
                <div
                  onClick={() => playTrack(FEATURED_TRACKS[0])}
                  style={{ display: "flex", alignItems: "center", gap: "16px", background: "rgba(255,255,255,0.08)", borderRadius: "6px", padding: "10px 16px", marginBottom: "32px", cursor: "pointer", maxWidth: "320px", transition: "background 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                >
                  <div style={{ width: "48px", height: "48px", background: "linear-gradient(135deg, #6c47b7, #1DB954)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>❤️</div>
                  <div>
                    <div style={{ fontSize: "15px", fontWeight: 700 }}>Favorites</div>
                    <div style={{ fontSize: "11px", color: "#B3B3B3" }}>42 Songs</div>
                  </div>
                </div>
                <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 16px" }}>Vishnu's Favorites</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "20px" }}>
                  {FEATURED_TRACKS.map((track) => (
                    <TrackCard
                      key={track.id}
                      track={track}
                      active={currentTrack.id === track.id && ytPlaying}
                      onPlay={() => playTrack(track)}
                    />
                  ))}
                </div>
              </>
            )}

            {/* ── SEARCH VIEW ── */}
            {view === "search" && (
              <>
                <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 16px" }}>Search</h1>

                <div style={{ position: "relative", marginBottom: "24px", maxWidth: "600px" }}>
                  <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", fontSize: "16px", pointerEvents: "none" }}>🔍</span>
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    placeholder="Search any song or artist — plays full song via YouTube..."
                    style={{ width: "100%", boxSizing: "border-box", padding: "14px 18px 14px 46px", borderRadius: "30px", background: "#2a2a2a", border: "none", outline: "none", color: "#FFFFFF", fontSize: "14px" }}
                  />
                  {searchQuery && (
                    <button onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                      style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#B3B3B3", cursor: "pointer", fontSize: "14px" }}>
                      ✕
                    </button>
                  )}
                </div>

                {isSearching && (
                  <div style={{ padding: "30px", textAlign: "center", color: "#B3B3B3" }}>
                    <div style={{ fontSize: "28px", marginBottom: "8px" }}>⏳</div>
                    Searching music library...
                  </div>
                )}

                {!isSearching && searchResults.length > 0 && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                      <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Top Results</h2>
                      <span style={{ fontSize: "11px", color: "#1DB954", background: "rgba(29,185,84,0.12)", borderRadius: "20px", padding: "3px 10px" }}>
                        🎵 Full songs via YouTube
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {searchResults.map((track, i) => (
                        <SearchResultRow
                          key={`${track.id}-${i}`}
                          track={track}
                          index={i + 1}
                          active={currentTrack.id === track.id && ytPlaying}
                          onPlay={() => playTrack(track)}
                        />
                      ))}
                    </div>
                  </>
                )}

                {!isSearching && searchResults.length === 0 && (
                  <>
                    <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 14px", color: "#B3B3B3" }}>Browse All Categories</h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "16px" }}>
                      {GENRES.map((g) => (
                        <div
                          key={g.name}
                          onClick={() => { setSearchQuery(g.name); performSearch(g.query); }}
                          style={{ background: g.color, borderRadius: "8px", padding: "16px", height: "90px", cursor: "pointer", fontWeight: 700, fontSize: "15px", display: "flex", alignItems: "flex-end", boxShadow: "0 4px 12px rgba(0,0,0,0.3)", transition: "transform 0.15s ease" }}
                          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                        >
                          {g.name}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Player Bar ── */}
      <div style={{ height: "86px", background: "#181818", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", padding: "0 20px", justifyContent: "space-between", flexShrink: 0 }}>
        {/* Track Info */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", width: "280px", flexShrink: 0 }}>
          <img
            src={currentTrack.thumbnail || "/music/thumbnail.png"}
            alt={currentTrack.title}
            style={{ width: "56px", height: "56px", borderRadius: "6px", objectFit: "cover", flexShrink: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}
            onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&q=80"; }}
          />
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack.title}</div>
            <div style={{ fontSize: "11px", color: "#B3B3B3", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack.artist}</div>
          </div>
          <button onClick={() => setLiked(!liked)}
            style={{ background: "none", border: "none", color: liked ? "#1DB954" : "#535353", cursor: "pointer", fontSize: "16px", marginLeft: "4px" }}>
            ♥
          </button>
        </div>

        {/* Center Controls + Timeline */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flex: 1, maxWidth: "540px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <button style={{ background: "none", border: "none", color: "#B3B3B3", fontSize: "16px", cursor: "pointer" }}>⇄</button>
            <button onClick={() => playTrack(FEATURED_TRACKS[0])} style={{ background: "none", border: "none", color: "#B3B3B3", fontSize: "16px", cursor: "pointer" }}>⏮</button>
            <button
              onClick={togglePlay}
              style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#FFFFFF", border: "none", color: "#000", fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "transform 0.1s ease" }}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.94)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {ytPlaying ? "⏸" : "▶"}
            </button>
            <button onClick={() => playTrack(FEATURED_TRACKS[1])} style={{ background: "none", border: "none", color: "#B3B3B3", fontSize: "16px", cursor: "pointer" }}>⏭</button>
            <button style={{ background: "none", border: "none", color: "#B3B3B3", fontSize: "16px", cursor: "pointer" }}>↺</button>
          </div>

          {/* Interactive Seek Timeline */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
            <span style={{ fontSize: "11px", color: "#B3B3B3", minWidth: "36px", textAlign: "right" }}>{fmtTime(displayTime)}</span>
            <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", height: "14px" }}>
              <input
                type="range"
                min={0}
                max={duration > 0 ? duration : 100}
                step={0.5}
                value={isDragging ? dragTime : ytTime}
                onChange={handleSeekChange}
                onMouseUp={handleSeekCommit}
                onTouchEnd={handleSeekCommit}
                style={{
                  width: "100%",
                  height: "4px",
                  appearance: "none",
                  WebkitAppearance: "none",
                  borderRadius: "2px",
                  background: `linear-gradient(to right, #1DB954 ${progressPct}%, #535353 ${progressPct}%)`,
                  outline: "none",
                  cursor: "pointer",
                  margin: 0,
                }}
              />
            </div>
            <span style={{ fontSize: "11px", color: "#B3B3B3", minWidth: "36px" }}>{duration > 0 ? fmtTime(duration) : currentTrack.duration || "—"}</span>
          </div>
        </div>

        {/* Volume */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "200px", justifyContent: "flex-end", flexShrink: 0 }}>
          <button onClick={() => setVideoExpanded(!videoExpanded)} style={{ background: "none", border: "none", color: videoExpanded ? "#1DB954" : "#B3B3B3", cursor: "pointer", fontSize: "16px" }}>📺</button>
          <span style={{ fontSize: "14px" }}>🔊</span>
          <input type="range" min={0} max={100} defaultValue={80}
            onChange={(e) => {
              const vol = parseInt(e.target.value) / 100;
              try { ytPlayerRef.current?.setVolume(parseInt(e.target.value)); } catch (_) {}
              audioCtrl.volume(vol);
            }}
            style={{ width: "80px", accentColor: "#1DB954", cursor: "pointer" }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Track Card ────────────────────────────────────────────────────────────────
function TrackCard({ track, active, onPlay }: { track: Track; active: boolean; onPlay: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onPlay}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: hovered ? "#282828" : "#181818", borderRadius: "8px", padding: "14px", cursor: "pointer", position: "relative", transition: "background 0.2s ease" }}
    >
      <div style={{ position: "relative", marginBottom: "12px" }}>
        <img
          src={track.thumbnail}
          alt={track.title}
          style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: "6px", display: "block" }}
          onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80"; }}
        />
        {track.badge && (
          <div style={{ position: "absolute", top: "8px", left: "8px", background: "#1DB954", color: "#000", borderRadius: "3px", padding: "2px 6px", fontSize: "9px", fontWeight: 800 }}>
            {track.badge}
          </div>
        )}
        {(hovered || active) && (
          <div style={{ position: "absolute", bottom: "8px", right: "8px", width: "42px", height: "42px", borderRadius: "50%", background: "#1DB954", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", color: "#000", boxShadow: "0 6px 16px rgba(0,0,0,0.6)" }}>
            {active ? "⏸" : "▶"}
          </div>
        )}
      </div>
      <div style={{ fontSize: "14px", fontWeight: 700, color: active ? "#1DB954" : "#FFF", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</div>
      <div style={{ fontSize: "12px", color: "#B3B3B3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.artist}</div>
    </div>
  );
}

// ── Search Result Row ──────────────────────────────────────────────────────────
function SearchResultRow({ track, index, active, onPlay }: { track: Track; index: number; active: boolean; onPlay: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onPlay}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: "grid", gridTemplateColumns: "32px 50px 1fr auto", alignItems: "center", gap: "14px", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", background: active ? "rgba(255,255,255,0.12)" : hovered ? "rgba(255,255,255,0.06)" : "transparent", transition: "background 0.15s ease" }}
    >
      <div style={{ textAlign: "center", fontSize: "13px", color: active ? "#1DB954" : "#B3B3B3", fontWeight: active ? 700 : 500 }}>
        {hovered || active ? (active ? "⏸" : "▶") : index}
      </div>
      <img
        src={track.thumbnail}
        alt={track.title}
        style={{ width: "48px", height: "48px", borderRadius: "4px", objectFit: "cover" }}
        onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&q=80"; }}
      />
      <div style={{ overflow: "hidden" }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: active ? "#1DB954" : "#FFF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</div>
        <div style={{ fontSize: "12px", color: "#B3B3B3" }}>{track.artist}</div>
      </div>
      <div style={{ fontSize: "12px", color: "#B3B3B3", paddingRight: "10px" }}>{track.duration || "—"}</div>
    </div>
  );
}