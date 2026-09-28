import React, { useState, useRef, useCallback } from "react";
import { useAudioContext } from "~/context/AudioContext";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Track {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  audioUrl?: string;
  duration?: string;
  durationSec?: number;
  badge?: string;
  youtubeId?: string;
}

// ── Curated Tracks (Vishnu's Favorites with real audio + YouTube IDs) ─────────
const FEATURED_TRACKS: Track[] = [
  {
    id: "wEWF2xh5E8s",
    youtubeId: "wEWF2xh5E8s",
    title: "Sadness and Sorrow",
    artist: "Naruto Soundtrack",
    badge: "VISHNU'S FAVORITE",
    thumbnail: "https://img.youtube.com/vi/wEWF2xh5E8s/hqdefault.jpg",
    audioUrl: "/music/faded.mp3",
    duration: "4:32",
    durationSec: 272,
  },
  {
    id: "jgpJVI3tDbY",
    youtubeId: "jgpJVI3tDbY",
    title: "Opening 1 – Hero's Come Back!",
    artist: "Naruto Shippuden",
    badge: "VISHNU'S FAVORITE",
    thumbnail: "https://img.youtube.com/vi/jgpJVI3tDbY/hqdefault.jpg",
    audioUrl: "/music/playsong.mp3",
    duration: "3:45",
    durationSec: 225,
  },
  {
    id: "jfKfPfyJRdk",
    youtubeId: "jfKfPfyJRdk",
    title: "Lofi Hip Hop – Relaxing Beats",
    artist: "Lofi Girl",
    badge: "CODING ESSENTIAL",
    thumbnail: "https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg",
    audioUrl: "/music/into.wav",
    duration: "2:40",
    durationSec: 160,
  },
  {
    id: "UDVtMYqUAyw",
    youtubeId: "UDVtMYqUAyw",
    title: "Interstellar Main Theme",
    artist: "Hans Zimmer",
    badge: "MASTERPIECE",
    thumbnail: "https://img.youtube.com/vi/UDVtMYqUAyw/hqdefault.jpg",
    audioUrl: "/music/chime.wav",
    duration: "4:08",
    durationSec: 248,
  },
  {
    id: "34Na4j8AVgA",
    youtubeId: "34Na4j8AVgA",
    title: "Starboy",
    artist: "The Weeknd ft. Daft Punk",
    badge: "POPULAR",
    thumbnail: "https://img.youtube.com/vi/34Na4j8AVgA/hqdefault.jpg",
    audioUrl: "/music/faded.mp3",
    duration: "3:50",
    durationSec: 230,
  },
  {
    id: "sFlrn1fW0i8",
    youtubeId: "sFlrn1fW0i8",
    title: "GigaChad Theme (Phonk Remix)",
    artist: "g3ox_em",
    badge: "DEV MODE",
    thumbnail: "https://img.youtube.com/vi/sFlrn1fW0i8/hqdefault.jpg",
    audioUrl: "/music/playsong.mp3",
    duration: "2:24",
    durationSec: 144,
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
  { name: "Popular Hits", query: "popular hits", color: "#E8115B" },
  { name: "The Weeknd", query: "the weeknd", color: "#148A08" },
  { name: "Lofi Chill", query: "lofi beats", color: "#BA5D07" },
  { name: "Naruto OST", query: "naruto ost", color: "#1E3264" },
  { name: "Hans Zimmer", query: "hans zimmer", color: "#8D67AB" },
  { name: "Anime Hits", query: "anime soundtrack", color: "#1DB954" },
  { name: "Synthwave", query: "synthwave coding", color: "#E91429" },
  { name: "A.R. Rahman", query: "ar rahman hits", color: "#509BF5" },
];

function fmtTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Spotify() {
  const { audioState, controls } = useAudioContext();

  const [view, setView] = useState<"home" | "search">("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [videoExpanded, setVideoExpanded] = useState(false);
  const [liked, setLiked] = useState(true);

  // Timeline Scrubbing state
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Current active song from global AudioContext
  const currentSong = audioState.song;
  const isPlaying = audioState.playing;

  const duration = audioState.duration && !isNaN(audioState.duration) && audioState.duration > 0
    ? audioState.duration
    : (currentSong.duration || 210);

  const displayTime = isDragging ? dragTime : audioState.time;
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (displayTime / duration) * 100)) : 0;

  // Play any track: updates global AudioContext (syncs Control Center, Dynamic Island, and Spotify)
  const playTrack = useCallback(
    (track: Track) => {
      controls.setSong(
        {
          title: track.title,
          artist: track.artist,
          cover: track.thumbnail,
          src: track.audioUrl || "/music/faded.mp3",
          duration: track.durationSec,
          youtubeId: track.youtubeId,
        },
        true
      );
    },
    [controls]
  );

  // Timeline scrub / drag handlers
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setDragTime(val);
    if (!isDragging) setIsDragging(true);
  };

  const handleSeekCommit = () => {
    setIsDragging(false);
    controls.seek(dragTime);
  };

  // Search logic: uses iTunes Search API (instant, worldwide, high-res artwork, real audio streams)
  const performSearch = useCallback(async (query: string) => {
    const q = query.trim();
    if (!q) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=15`
      );
      const data = await res.json();

      if (data.results && data.results.length > 0) {
        const formatted: Track[] = data.results.map((r: any) => {
          const highResArt = r.artworkUrl100
            ? r.artworkUrl100.replace("100x100bb.jpg", "600x600bb.jpg")
            : "https://picsum.photos/300/300";
          const durSec = Math.floor((r.trackTimeMillis || 0) / 1000);

          return {
            id: String(r.trackId),
            title: r.trackName,
            artist: r.artistName,
            thumbnail: highResArt,
            audioUrl: r.previewUrl,
            duration: fmtTime(durSec),
            durationSec: durSec,
          };
        });
        setSearchResults(formatted);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.warn("Search error:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleQueryChange = (val: string) => {
    setSearchQuery(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      performSearch(val);
    }, 350);
  };

  // Embed URL for YouTube player
  const getEmbedUrl = () => {
    if (currentSong?.youtubeId) {
      return `https://www.youtube-nocookie.com/embed/${currentSong.youtubeId}?autoplay=1&enablejsapi=1`;
    }
    const query = `${currentSong?.title || "Music"} ${currentSong?.artist || ""}`;
    return `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(
      query
    )}&autoplay=1&enablejsapi=1`;
  };

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
      {/* ── Top Body: Left Sidebar + Main Content ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left Sidebar */}
        <div
          style={{
            width: "280px",
            minWidth: "220px",
            backgroundColor: "#000000",
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
          }}
        >
          {/* Navigation */}
          <div style={{ padding: "16px 12px 8px" }}>
            <div
              onClick={() => setView("home")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                borderRadius: "6px",
                cursor: "pointer",
                color: view === "home" ? "#FFFFFF" : "#B3B3B3",
                fontWeight: 700,
                fontSize: "15px",
                backgroundColor: view === "home" ? "rgba(255,255,255,0.08)" : "transparent",
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ fontSize: "18px" }}>🏠</span> Home
            </div>
            <div
              onClick={() => setView("search")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                borderRadius: "6px",
                cursor: "pointer",
                color: view === "search" ? "#FFFFFF" : "#B3B3B3",
                fontWeight: 700,
                fontSize: "15px",
                backgroundColor: view === "search" ? "rgba(255,255,255,0.08)" : "transparent",
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ fontSize: "18px" }}>🔍</span> Search
            </div>
          </div>

          {/* Your Library */}
          <div
            style={{
              flex: 1,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              padding: "0 8px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 10px 8px",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  color: "#B3B3B3",
                  fontWeight: 700,
                  fontSize: "13px",
                }}
              >
                <span>📚</span> Your Library
              </span>
              <span style={{ fontSize: "20px", color: "#B3B3B3", cursor: "pointer" }}>+</span>
            </div>

            {/* Playlists List */}
            <div style={{ flex: 1, overflowY: "auto", paddingBottom: "10px" }}>
              {PLAYLISTS.map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => {
                    setView("home");
                    playTrack(FEATURED_TRACKS[0]);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "6px",
                      background: pl.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "15px",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {pl.initial}
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#FFFFFF" }}>
                      {pl.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "#B3B3B3" }}>{pl.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main Content Area ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "linear-gradient(180deg, #1e1e38 0%, #121212 320px)",
          }}
        >
          {/* Header Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 24px",
              flexShrink: 0,
            }}
          >
            {/* Back / Forward */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setView("home")}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.6)",
                  border: "none",
                  color: "#FFF",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                ◀
              </button>
              <button
                onClick={() => setView("search")}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.6)",
                  border: "none",
                  color: "#FFF",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                ▶
              </button>
            </div>

            {/* Profile & Video Mode Toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                onClick={() => setVideoExpanded(!videoExpanded)}
                style={{
                  background: videoExpanded ? "#1DB954" : "rgba(255,255,255,0.12)",
                  color: videoExpanded ? "#000" : "#FFF",
                  border: "none",
                  borderRadius: "20px",
                  padding: "6px 14px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s",
                }}
              >
                <span>📺</span> {videoExpanded ? "Hide Video" : "Video Visualizer"}
              </button>

              <div
                style={{
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "20px",
                  padding: "6px 14px",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                🔔 Premium Active
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(0,0,0,0.4)",
                  padding: "4px 10px 4px 4px",
                  borderRadius: "20px",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "#1DB954",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    fontWeight: 800,
                    color: "#000",
                  }}
                >
                  V
                </div>
                <span style={{ fontSize: "13px", fontWeight: 700 }}>Vishnu M S</span>
              </div>
            </div>
          </div>

          {/* ── Scrollable View Container ── */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 24px" }}>
            {/* If Video Visualizer is expanded, show YouTube player right in the main window */}
            {videoExpanded && (
              <div
                style={{
                  marginBottom: "24px",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 12px 32px rgba(0,0,0,0.6)",
                  background: "#000",
                  aspectRatio: "16 / 9",
                  maxHeight: "360px",
                  width: "100%",
                }}
              >
                <iframe
                  title="YouTube Player"
                  src={getEmbedUrl()}
                  style={{ width: "100%", height: "100%", border: "none" }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            )}

            {/* ── HOME VIEW ── */}
            {view === "home" && (
              <>
                <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 20px" }}>
                  Welcome Back
                </h1>

                {/* Favorites Pill */}
                <div
                  onClick={() => playTrack(FEATURED_TRACKS[0])}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: "6px",
                    padding: "10px 16px",
                    marginBottom: "32px",
                    cursor: "pointer",
                    transition: "background 0.2s",
                    maxWidth: "320px",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,0.14)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
                  }
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      background: "linear-gradient(135deg, #6c47b7, #1DB954)",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "22px",
                    }}
                  >
                    ❤️
                  </div>
                  <div>
                    <div style={{ fontSize: "15px", fontWeight: 700 }}>Favorites</div>
                    <div style={{ fontSize: "11px", color: "#B3B3B3" }}>42 Songs</div>
                  </div>
                </div>

                {/* Featured / Vishnu's Favorites */}
                <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 16px" }}>
                  Vishnu's Favorites
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: "20px",
                  }}
                >
                  {FEATURED_TRACKS.map((track) => {
                    const isActive = currentSong?.title === track.title;
                    return (
                      <TrackCard
                        key={track.id}
                        track={track}
                        active={isActive && isPlaying}
                        onPlay={() => playTrack(track)}
                      />
                    );
                  })}
                </div>
              </>
            )}

            {/* ── SEARCH VIEW ── */}
            {view === "search" && (
              <>
                <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 16px" }}>Search</h1>

                {/* Search Bar */}
                <div style={{ position: "relative", marginBottom: "24px", maxWidth: "600px" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: "16px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "16px",
                      pointerEvents: "none",
                    }}
                  >
                    🔍
                  </span>
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    placeholder="Search song, artist, album (e.g. Popular weekend)..."
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "14px 18px 14px 46px",
                      borderRadius: "30px",
                      background: "#2a2a2a",
                      border: "none",
                      outline: "none",
                      color: "#FFFFFF",
                      fontSize: "14px",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      style={{
                        position: "absolute",
                        right: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "#B3B3B3",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Search Loading Indicator */}
                {isSearching && (
                  <div style={{ padding: "30px", textAlign: "center", color: "#B3B3B3" }}>
                    <div style={{ fontSize: "28px", marginBottom: "8px" }}>⏳</div>
                    Searching music library...
                  </div>
                )}

                {/* Search Results */}
                {!isSearching && searchResults.length > 0 && (
                  <div>
                    <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 16px" }}>
                      Top Results
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {searchResults.map((track, i) => {
                        const isActive = currentSong?.title === track.title;
                        return (
                          <SearchResultRow
                            key={`${track.id}-${i}`}
                            track={track}
                            index={i + 1}
                            active={isActive && isPlaying}
                            onPlay={() => playTrack(track)}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Empty State / Quick Genres */}
                {!isSearching && searchResults.length === 0 && (
                  <>
                    <h2
                      style={{
                        fontSize: "18px",
                        fontWeight: 700,
                        margin: "0 0 14px",
                        color: "#B3B3B3",
                      }}
                    >
                      Browse All Categories
                    </h2>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                        gap: "16px",
                      }}
                    >
                      {GENRES.map((g) => (
                        <div
                          key={g.name}
                          onClick={() => {
                            setSearchQuery(g.name);
                            performSearch(g.query);
                          }}
                          style={{
                            background: g.color,
                            borderRadius: "8px",
                            padding: "16px",
                            height: "90px",
                            cursor: "pointer",
                            fontWeight: 700,
                            fontSize: "16px",
                            display: "flex",
                            alignItems: "flex-end",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                            transition: "transform 0.15s ease",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.transform = "scale(1.03)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.transform = "scale(1)")
                          }
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

      {/* ── Bottom Player Bar (Syncs with Global System & Control Center) ── */}
      <div
        style={{
          height: "86px",
          background: "#181818",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        {/* Left: Track Details */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            width: "280px",
            flexShrink: 0,
          }}
        >
          <img
            src={currentSong?.cover || "/music/thumbnail.png"}
            alt={currentSong?.title || "Track"}
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "6px",
              objectFit: "cover",
              flexShrink: 0,
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&q=80";
            }}
          />
          <div style={{ overflow: "hidden" }}>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#FFF",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {currentSong?.title || "No track selected"}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#B3B3B3",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {currentSong?.artist || "Spotify"}
            </div>
          </div>
          <button
            onClick={() => setLiked(!liked)}
            style={{
              background: "none",
              border: "none",
              color: liked ? "#1DB954" : "#535353",
              cursor: "pointer",
              fontSize: "16px",
              marginLeft: "4px",
            }}
          >
            ♥
          </button>
        </div>

        {/* Center: Controls & Scrubbable Interactive Timeline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
            flex: 1,
            maxWidth: "540px",
          }}
        >
          {/* Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <button
              title="Shuffle"
              style={{
                background: "none",
                border: "none",
                color: "#B3B3B3",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              ⇄
            </button>
            <button
              title="Previous"
              onClick={() => playTrack(FEATURED_TRACKS[0])}
              style={{
                background: "none",
                border: "none",
                color: "#B3B3B3",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              ⏮
            </button>
            <button
              title={isPlaying ? "Pause" : "Play"}
              onClick={() => controls.toggle()}
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                background: "#FFFFFF",
                border: "none",
                color: "#000000",
                fontSize: "15px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "transform 0.1s ease",
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.94)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button
              title="Next"
              onClick={() => playTrack(FEATURED_TRACKS[1])}
              style={{
                background: "none",
                border: "none",
                color: "#B3B3B3",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              ⏭
            </button>
            <button
              title="Repeat"
              style={{
                background: "none",
                border: "none",
                color: "#B3B3B3",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              ↺
            </button>
          </div>

          {/* Interactive Scrubbable Timeline Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: "#B3B3B3",
                minWidth: "36px",
                textAlign: "right",
              }}
            >
              {fmtTime(displayTime)}
            </span>

            {/* Draggable & Clickable Timeline Slider */}
            <div
              style={{
                flex: 1,
                position: "relative",
                display: "flex",
                alignItems: "center",
                height: "14px",
              }}
            >
              <input
                type="range"
                min={0}
                max={duration > 0 ? duration : 100}
                step={0.5}
                value={displayTime}
                onChange={handleSeekChange}
                onMouseUp={handleSeekCommit}
                onTouchEnd={handleSeekCommit}
                style={{
                  width: "100%",
                  height: "4px",
                  appearance: "none",
                  WebkitAppearance: "none",
                  borderRadius: "2px",
                  background: `linear-gradient(to right, #1DB954 ${progressPercent}%, #535353 ${progressPercent}%)`,
                  outline: "none",
                  cursor: "pointer",
                  margin: 0,
                }}
              />
            </div>

            <span
              style={{
                fontSize: "11px",
                color: "#B3B3B3",
                minWidth: "36px",
              }}
            >
              {fmtTime(duration)}
            </span>
          </div>
        </div>

        {/* Right: Volume & Video Mode */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            width: "200px",
            justifyContent: "flex-end",
            flexShrink: 0,
          }}
        >
          <button
            title={videoExpanded ? "Collapse video" : "Expand video"}
            onClick={() => setVideoExpanded(!videoExpanded)}
            style={{
              background: "none",
              border: "none",
              color: videoExpanded ? "#1DB954" : "#B3B3B3",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            📺
          </button>
          <span
            style={{ fontSize: "14px", cursor: "pointer" }}
            onClick={() => controls.volume(audioState.volume > 0 ? 0 : 0.8)}
          >
            {audioState.volume === 0 ? "🔇" : audioState.volume < 0.5 ? "🔉" : "🔊"}
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={audioState.volume}
            onChange={(e) => controls.volume(parseFloat(e.target.value))}
            style={{ width: "80px", accentColor: "#1DB954", cursor: "pointer" }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Track Card (Home Grid) ──────────────────────────────────────────────────
function TrackCard({
  track,
  active,
  onPlay,
}: {
  track: Track;
  active: boolean;
  onPlay: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onPlay}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#282828" : "#181818",
        borderRadius: "8px",
        padding: "14px",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.2s ease",
      }}
    >
      <div style={{ position: "relative", marginBottom: "12px" }}>
        <img
          src={track.thumbnail}
          alt={track.title}
          style={{
            width: "100%",
            aspectRatio: "1",
            objectFit: "cover",
            borderRadius: "6px",
            display: "block",
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80";
          }}
        />

        {/* Badge */}
        {track.badge && (
          <div
            style={{
              position: "absolute",
              top: "8px",
              left: "8px",
              background: "#1DB954",
              color: "#000",
              borderRadius: "3px",
              padding: "2px 6px",
              fontSize: "9px",
              fontWeight: 800,
              letterSpacing: "0.5px",
            }}
          >
            {track.badge}
          </div>
        )}

        {/* Play Button Overlay */}
        {(hovered || active) && (
          <div
            style={{
              position: "absolute",
              bottom: "8px",
              right: "8px",
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              background: "#1DB954",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              color: "#000",
              boxShadow: "0 6px 16px rgba(0,0,0,0.6)",
            }}
          >
            {active ? "⏸" : "▶"}
          </div>
        )}
      </div>

      <div
        style={{
          fontSize: "14px",
          fontWeight: 700,
          color: active ? "#1DB954" : "#FFFFFF",
          marginBottom: "4px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {track.title}
      </div>
      <div
        style={{
          fontSize: "12px",
          color: "#B3B3B3",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {track.artist}
      </div>
    </div>
  );
}

// ── Search Result Row ───────────────────────────────────────────────────────
function SearchResultRow({
  track,
  index,
  active,
  onPlay,
}: {
  track: Track;
  index: number;
  active: boolean;
  onPlay: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onPlay}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "32px 50px 1fr auto",
        alignItems: "center",
        gap: "14px",
        padding: "8px 12px",
        borderRadius: "6px",
        cursor: "pointer",
        background: active
          ? "rgba(255,255,255,0.12)"
          : hovered
          ? "rgba(255,255,255,0.06)"
          : "transparent",
        transition: "background 0.15s ease",
      }}
    >
      <div
        style={{
          textAlign: "center",
          fontSize: "13px",
          color: active ? "#1DB954" : "#B3B3B3",
          fontWeight: active ? 700 : 500,
        }}
      >
        {hovered || active ? (active ? "⏸" : "▶") : index}
      </div>

      <img
        src={track.thumbnail}
        alt={track.title}
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "4px",
          objectFit: "cover",
        }}
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&q=80";
        }}
      />

      <div style={{ overflow: "hidden" }}>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: active ? "#1DB954" : "#FFFFFF",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {track.title}
        </div>
        <div style={{ fontSize: "12px", color: "#B3B3B3" }}>{track.artist}</div>
      </div>

      <div style={{ fontSize: "12px", color: "#B3B3B3", paddingRight: "10px" }}>
        {track.duration || "3:30"}
      </div>
    </div>
  );
}