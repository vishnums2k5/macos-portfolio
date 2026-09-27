import React from "react";
import { useStore } from "~/stores";

// Playlist data — fully self-contained, no external iframe
const PLAYLISTS = [
  { id: "p1", name: "My Playlist #6", color: "#6c47b7", initial: "#6", desc: "Playlist • Vishnu" },
  { id: "p2", name: "Lofi Chill", color: "#2d7a4f", initial: "L", desc: "Playlist • Vishnu" },
  { id: "p3", name: "Dev Mode", color: "#b7471c", initial: "D", desc: "Playlist • Vishnu" },
  { id: "p4", name: "GuideRealm", color: "#1a7a47", initial: "GR", desc: "Playlist • Vishnu" },
  { id: "p5", name: "Focus Flow", color: "#1c4db7", initial: "FF", desc: "Playlist • Vishnu" },
  { id: "p6", name: "Night Coding", color: "#7a1a1a", initial: "NC", desc: "Playlist • Vishnu" },
];

const FEATURED = [
  {
    id: "f1",
    title: "Opening 1 – Hero's Co...",
    artist: "By Naruto Shippuden",
    badge: "VISHNU'S FAVORITE",
    cover: "https://picsum.photos/seed/naruto1/200/200",
  },
  {
    id: "f2",
    title: "Sadness and Sorrow (...",
    artist: "By Naruto Soundtrack",
    badge: "VISHNU'S FAVORITE",
    cover: "https://picsum.photos/seed/naruto2/200/200",
  },
];

export default function Spotify() {
  const dark = useStore((state) => state.dark);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<"Playlists" | "Artists" | "Albums">("Playlists");

  const bg = "#121212";
  const sidebar = "#000000";
  const card = "#181818";
  const accent = "#1DB954";
  const text = "#FFFFFF";
  const muted = "#B3B3B3";

  return (
    <div style={{ display: "flex", width: "100%", height: "100%", fontFamily: "'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif", backgroundColor: bg, color: text, overflow: "hidden", borderRadius: "inherit" }}>
      {/* Left Sidebar */}
      <div style={{ width: "300px", minWidth: "220px", backgroundColor: sidebar, display: "flex", flexDirection: "column", borderRight: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        {/* Nav */}
        <div style={{ padding: "16px 12px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", color: text, fontWeight: 700, fontSize: "16px" }}>
            <span style={{ fontSize: "22px" }}>🏠</span> Home
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", color: muted, fontSize: "16px" }}>
            <span style={{ fontSize: "22px" }}>🔍</span> Search
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
          {/* Tabs */}
          <div style={{ display: "flex", gap: "6px", padding: "0 4px 12px" }}>
            {(["Playlists", "Artists", "Albums"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                style={{
                  background: activeTab === t ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)",
                  border: "none",
                  borderRadius: "20px",
                  color: text,
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "4px 12px",
                  cursor: "pointer",
                }}
              >
                {t}
              </button>
            ))}
          </div>
          {/* Search in library */}
          <div style={{ display: "flex", alignItems: "center", backgroundColor: "rgba(255,255,255,0.07)", borderRadius: "6px", padding: "6px 10px", margin: "0 4px 10px", gap: "8px" }}>
            <span style={{ color: muted, fontSize: "14px" }}>🔍</span>
            <span style={{ color: muted, fontSize: "13px" }}>Search in Your Library</span>
          </div>
          {/* Playlists */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", padding: "6px 10px", cursor: "pointer", borderRadius: "6px", gap: "12px", backgroundColor: "rgba(255,255,255,0.06)", marginBottom: "4px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "4px", background: "linear-gradient(135deg,#4a00e0,#8e2de2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>❤️</div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600 }}>Liked Songs</div>
                <div style={{ fontSize: "11px", color: muted }}>Playlist • 42 songs</div>
              </div>
            </div>
            {PLAYLISTS.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelected(p.id)}
                style={{ display: "flex", alignItems: "center", padding: "6px 10px", cursor: "pointer", borderRadius: "6px", gap: "12px", backgroundColor: selected === p.id ? "rgba(255,255,255,0.1)" : "transparent", marginBottom: "2px" }}
              >
                <div style={{ width: "40px", height: "40px", borderRadius: "4px", backgroundColor: p.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                  {p.initial}
                </div>
                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontSize: "13px", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                  <div style={{ fontSize: "11px", color: muted }}>{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: "auto", backgroundColor: "#1a1a1a", display: "flex", flexDirection: "column" }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", position: "sticky", top: 0, zIndex: 10, background: "rgba(26,26,26,0.95)", backdropFilter: "blur(20px)" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <button style={{ width: "28px", height: "28px", borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.5)", color: muted, cursor: "pointer", fontSize: "14px" }}>◀</button>
            <button style={{ width: "28px", height: "28px", borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.5)", color: muted, cursor: "pointer", fontSize: "14px" }}>▶</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "20px", color: text, fontSize: "13px", fontWeight: 700, padding: "6px 16px", cursor: "pointer" }}>
              Premium Active
            </button>
            <button style={{ background: "transparent", border: "none", color: muted, fontSize: "20px", cursor: "pointer" }}>🔔</button>
            <button style={{ background: "transparent", border: "none", color: muted, fontSize: "20px", cursor: "pointer" }}>👥</button>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(0,0,0,0.5)", borderRadius: "20px", padding: "4px 12px 4px 4px", cursor: "pointer" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700 }}>V</div>
              <span style={{ fontSize: "13px", fontWeight: 700 }}>Vishnu M S</span>
            </div>
          </div>
        </div>

        {/* Hero */}
        <div style={{ padding: "16px 24px 0" }}>
          <h2 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "20px" }}>Welcome Back</h2>

          {/* Favorites card */}
          <div style={{ display: "flex", alignItems: "center", gap: "0", background: "rgba(255,255,255,0.08)", borderRadius: "6px", overflow: "hidden", marginBottom: "32px", cursor: "pointer", maxWidth: "320px" }}>
            <div style={{ width: "64px", height: "64px", background: "linear-gradient(135deg,#4a00e0,#8e2de2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", flexShrink: 0 }}>❤️</div>
            <span style={{ fontWeight: 700, fontSize: "16px", paddingLeft: "16px" }}>Favorites</span>
          </div>

          {/* Vishnu's Favorites section */}
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "16px" }}>Vishnu's Favorites</h3>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              {FEATURED.map((f) => (
                <div key={f.id} style={{ width: "180px", cursor: "pointer" }}>
                  <div style={{ position: "relative", marginBottom: "10px" }}>
                    <img
                      src={f.cover}
                      alt={f.title}
                      style={{ width: "180px", height: "180px", borderRadius: "8px", objectFit: "cover" }}
                    />
                    <div style={{ position: "absolute", top: "8px", left: "8px", background: accent, borderRadius: "4px", padding: "2px 7px", fontSize: "9px", fontWeight: 800, color: "#000", letterSpacing: "0.5px" }}>
                      {f.badge}
                    </div>
                    <button style={{ position: "absolute", bottom: "8px", right: "8px", width: "40px", height: "40px", borderRadius: "50%", background: accent, border: "none", color: "#000", fontSize: "18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                    >▶</button>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.title}</div>
                  <div style={{ fontSize: "11px", color: muted, marginTop: "2px" }}>{f.artist}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}