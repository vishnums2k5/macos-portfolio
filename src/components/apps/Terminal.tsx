import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
} from "react";
import terminalConfig from "~/configs/terminal";
import type { TerminalData } from "~/types";

// ── Types ──────────────────────────────────────────────────────────────────────
interface OutputLine {
  id: number;
  type: "input" | "output" | "error" | "system";
  content: React.ReactNode;
  prompt?: string;
}

interface FileSystem {
  [key: string]: TerminalData[];
}

// ── Colors (macOS Terminal "Pro" profile) ─────────────────────────────────────
const COLORS = {
  bg: "#1a1a1a",
  text: "#f2f2f2",
  dimText: "#8e8e93",
  prompt: {
    user: "#32d74b",   // green — user@host
    path: "#0a84ff",   // blue  — path
    arrow: "#ff9f0a",  // orange — %
  },
  dir: "#0a84ff",
  file: "#f2f2f2",
  exe: "#32d74b",
  error: "#ff453a",
  yellow: "#ffd60a",
  cyan: "#5ac8fa",
  pink: "#ff375f",
  purple: "#bf5af2",
};

// ── Traffic light colors ──────────────────────────────────────────────────────
const TL = { red: "#ff5f57", yellow: "#febc2e", green: "#28c840" };

// ── Helpers ───────────────────────────────────────────────────────────────────
let lineCounter = 0;
const uid = () => lineCounter++;

function formatDate() {
  return new Date().toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ── Terminal Component ─────────────────────────────────────────────────────────
export default function Terminal() {
  const [lines, setLines] = useState<OutputLine[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [curDirPath, setCurDirPath] = useState<string[]>([]);
  const [rmrfActive, setRmrfActive] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<OutputLine[]>([]);
  linesRef.current = lines;

  const curDirPathRef = useRef<string[]>([]);
  curDirPathRef.current = curDirPath;

  // ── Filesystem helpers ──────────────────────────────────────────────────────
  const getCurChildren = useCallback((dirPath: string[]): TerminalData[] => {
    let children: TerminalData[] = terminalConfig as TerminalData[];
    for (const name of dirPath) {
      const folder = children.find(
        (item) => item.title === name && item.type === "folder"
      );
      if (!folder || !folder.children) return [];
      children = folder.children;
    }
    return children;
  }, []);

  const getCurDirName = (dirPath: string[]) =>
    dirPath.length === 0 ? "~" : dirPath[dirPath.length - 1];

  const getPrompt = (dirPath: string[]) => {
    const dir = getCurDirName(dirPath);
    return (
      <span style={{ userSelect: "none" }}>
        <span style={{ color: COLORS.prompt.user }}>vishnums@MacBook-Pro</span>
        <span style={{ color: COLORS.dimText }}> </span>
        <span style={{ color: COLORS.prompt.path }}>{dir}</span>
        <span style={{ color: COLORS.prompt.arrow }}> % </span>
      </span>
    );
  };

  // ── Append lines ──────────────────────────────────────────────────────────────
  const addLine = useCallback((content: React.ReactNode, type: OutputLine["type"] = "output") => {
    const line: OutputLine = { id: uid(), type, content };
    setLines((prev) => [...prev, line]);
  }, []);

  // ── Scroll to bottom on new lines ─────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  // ── Boot message ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const bootLines: React.ReactNode[] = [
      <span key="last-login" style={{ color: COLORS.dimText }}>
        Last login: {formatDate()} on ttys001
      </span>,
      <span key="welcome" style={{ color: COLORS.cyan }}>
        Welcome to Vishnu's macOS Portfolio Terminal
      </span>,
      <span key="tip" style={{ color: COLORS.dimText }}>
        Type{" "}
        <span style={{ color: COLORS.yellow }}>help</span>{" "}
        to see available commands.
      </span>,
      <span key="blank"> </span>,
    ];
    bootLines.forEach((line) => addLine(line, "system"));

    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // ── Commands ─────────────────────────────────────────────────────────────────
  const runCommand = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      const parts = trimmed.split(/\s+/);
      const cmd = parts[0] ?? "";
      const arg = parts.slice(1).join(" ");
      const dirPath = curDirPathRef.current;
      const children = getCurChildren(dirPath);

      if (!cmd) return;

      switch (cmd) {
        case "help": {
          const helpContent = (
            <div style={{ color: COLORS.text, lineHeight: 1.7 }}>
              <div style={{ color: COLORS.yellow, marginBottom: 4 }}>
                Available commands:
              </div>
              {[
                ["ls", "List files and directories"],
                ["cd <dir>", "Change directory  (cd .. | cd ~ | cd <name>)"],
                ["cat <file>", "Display file contents"],
                ["pwd", "Print working directory"],
                ["whoami", "Display current user"],
                ["echo <text>", "Print text to the terminal"],
                ["date", "Show current date and time"],
                ["clear", "Clear the terminal screen"],
                ["help", "Show this help message"],
                ["rm -rf /", ":)"],
              ].map(([name, desc]) => (
                <div key={name} style={{ display: "flex", gap: 8 }}>
                  <span style={{ color: COLORS.exe, minWidth: 140 }}>{name}</span>
                  <span style={{ color: COLORS.dimText }}>{desc}</span>
                </div>
              ))}
              <div style={{ marginTop: 8, color: COLORS.dimText }}>
                <span style={{ color: COLORS.text }}>↑ / ↓</span> — history  &nbsp;
                <span style={{ color: COLORS.text }}>Tab</span> — auto-complete
              </div>
            </div>
          );
          addLine(helpContent);
          break;
        }

        case "ls": {
          if (children.length === 0) {
            addLine(<span style={{ color: COLORS.dimText }}>empty directory</span>);
          } else {
            const grid = (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "2px 16px",
                  paddingTop: 2,
                }}
              >
                {children.map((item) => (
                  <span
                    key={item.id}
                    style={{
                      color: item.type === "folder" ? COLORS.dir : COLORS.file,
                      fontWeight: item.type === "folder" ? 600 : 400,
                    }}
                  >
                    {item.type === "folder" ? "📁 " : "📄 "}
                    {item.title}
                    {item.type === "folder" ? "/" : ""}
                  </span>
                ))}
              </div>
            );
            addLine(grid);
          }
          break;
        }

        case "cd": {
          if (!arg || arg === "~") {
            setCurDirPath([]);
          } else if (arg === ".") {
            // stay
          } else if (arg === "..") {
            setCurDirPath((prev) => prev.slice(0, -1));
          } else {
            const target = children.find(
              (item) => item.title === arg && item.type === "folder"
            );
            if (!target) {
              addLine(
                <span style={{ color: COLORS.error }}>
                  cd: no such file or directory: {arg}
                </span>,
                "error"
              );
            } else {
              setCurDirPath((prev) => [...prev, arg]);
            }
          }
          break;
        }

        case "cat": {
          if (!arg) {
            addLine(
              <span style={{ color: COLORS.error }}>
                usage: cat &lt;filename&gt;
              </span>,
              "error"
            );
            break;
          }
          const file = children.find(
            (item) => item.title === arg && item.type === "file"
          );
          if (!file) {
            addLine(
              <span style={{ color: COLORS.error }}>
                cat: {arg}: No such file or directory
              </span>,
              "error"
            );
          } else {
            addLine(
              <div style={{ paddingTop: 2, paddingBottom: 2 }}>
                {file.content}
              </div>
            );
          }
          break;
        }

        case "pwd": {
          const path = "/" + ["Users", "vishnums", ...dirPath].join("/");
          addLine(<span style={{ color: COLORS.text }}>{path}</span>);
          break;
        }

        case "whoami": {
          addLine(<span style={{ color: COLORS.text }}>vishnums</span>);
          break;
        }

        case "echo": {
          addLine(<span style={{ color: COLORS.text }}>{arg}</span>);
          break;
        }

        case "date": {
          addLine(<span style={{ color: COLORS.text }}>{formatDate()}</span>);
          break;
        }

        case "clear": {
          setLines([]);
          return;
        }

        case "rm": {
          if (arg === "-rf" || raw.includes("rm -rf")) {
            setRmrfActive(true);
            return;
          }
          addLine(
            <span style={{ color: COLORS.error }}>
              rm: permission denied — this is a portfolio, not a real system 😄
            </span>,
            "error"
          );
          break;
        }

        case "neofetch": {
          addLine(renderNeofetch(dirPath));
          break;
        }

        case "open": {
          if (arg) {
            addLine(
              <span style={{ color: COLORS.dimText }}>
                Opening {arg}... (simulated)
              </span>
            );
          }
          break;
        }

        default: {
          addLine(
            <span style={{ color: COLORS.error }}>
              zsh: command not found: {cmd}
            </span>,
            "error"
          );
        }
      }
    },
    [addLine, getCurChildren]
  );

  // ── neofetch easter egg ───────────────────────────────────────────────────────
  const renderNeofetch = (dirPath: string[]) => (
    <div style={{ display: "flex", gap: 24, paddingTop: 4, paddingBottom: 4 }}>
      <pre style={{ color: COLORS.prompt.user, fontSize: 11, lineHeight: 1.3, flexShrink: 0 }}>
{`   ████████   
  ██████████  
 ████████████ 
 ████████████ 
 ████████████ 
  ██████████  
   ████████   
 ▀▀▀▀▀▀▀▀▀▀▀ `}
      </pre>
      <div style={{ fontSize: 13, lineHeight: 1.8 }}>
        <div><span style={{ color: COLORS.prompt.user }}>vishnums</span><span style={{ color: COLORS.dimText }}>@</span><span style={{ color: COLORS.prompt.user }}>MacBook-Pro</span></div>
        <div style={{ color: COLORS.dimText }}>───────────────────────</div>
        {[
          ["OS", "macOS 15.4 Sequoia"],
          ["Host", "MacBook Pro (M4 Pro)"],
          ["Shell", "zsh 5.9"],
          ["Terminal", "Vishnu Portfolio v1.0"],
          ["CPU", "Apple M4 Pro"],
          ["Memory", "24 GB"],
          ["Node", "v20.11.0"],
          ["pnpm", "11.0.0"],
        ].map(([k, v]) => (
          <div key={k}>
            <span style={{ color: COLORS.cyan }}>{k}: </span>
            <span style={{ color: COLORS.text }}>{v}</span>
          </div>
        ))}
        <div style={{ marginTop: 8, display: "flex", gap: 4 }}>
          {["#ff453a","#ff9f0a","#ffd60a","#32d74b","#0a84ff","#5ac8fa","#bf5af2","#f2f2f2"].map((c) => (
            <span key={c} style={{ background: c, display: "inline-block", width: 16, height: 16, borderRadius: 3 }} />
          ))}
        </div>
      </div>
    </div>
  );

  // ── Auto-complete ──────────────────────────────────────────────────────────────
  const autoComplete = useCallback(
    (text: string) => {
      if (!text.trim()) return text;
      const parts = text.split(/\s+/);
      const cmd = parts[0];
      const arg = parts[1] ?? "";

      const CMDS = ["ls", "cd", "cat", "pwd", "whoami", "echo", "date", "clear", "help", "neofetch", "rm", "open"];

      if (parts.length === 1) {
        const match = CMDS.find((c) => c.startsWith(cmd) && c !== cmd);
        return match ?? text;
      }

      if (cmd === "cd" || cmd === "cat" || cmd === "open") {
        const children = getCurChildren(curDirPathRef.current);
        const type = cmd === "cat" ? "file" : cmd === "cd" ? "folder" : undefined;
        const match = children.find(
          (item) =>
            item.title.startsWith(arg) &&
            (type === undefined || item.type === type)
        );
        if (match) return `${cmd} ${match.title}`;
      }

      return text;
    },
    [getCurChildren]
  );

  // ── Key handler ────────────────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        const raw = inputValue;
        const dirPath = curDirPathRef.current;

        // Echo input line
        addLine(
          <div style={{ display: "flex", alignItems: "baseline", gap: 0, flexWrap: "nowrap" }}>
            {getPrompt(dirPath)}
            <span style={{ color: COLORS.text }}>{raw}</span>
          </div>,
          "input"
        );

        if (raw.trim()) {
          setHistory((prev) => [...prev, raw.trim()]);
        }
        setHistoryIdx(-1);
        setInputValue("");
        runCommand(raw);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHistory((hist) => {
          setHistoryIdx((idx) => {
            const newIdx = idx < 0 ? hist.length - 1 : Math.max(0, idx - 1);
            setInputValue(hist[newIdx] ?? "");
            return newIdx;
          });
          return hist;
        });
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setHistory((hist) => {
          setHistoryIdx((idx) => {
            const newIdx = idx < 0 ? -1 : Math.min(hist.length, idx + 1);
            setInputValue(newIdx >= hist.length ? "" : hist[newIdx] ?? "");
            return newIdx;
          });
          return hist;
        });
      } else if (e.key === "Tab") {
        e.preventDefault();
        setInputValue((v) => autoComplete(v));
      } else if (e.key === "l" && e.ctrlKey) {
        e.preventDefault();
        setLines([]);
      } else if (e.key === "c" && e.ctrlKey) {
        e.preventDefault();
        const dirPath = curDirPathRef.current;
        addLine(
          <div style={{ display: "flex", alignItems: "baseline" }}>
            {getPrompt(dirPath)}
            <span style={{ color: COLORS.text }}>{inputValue}^C</span>
          </div>,
          "input"
        );
        setInputValue("");
      }
    },
    [inputValue, addLine, runCommand, autoComplete]
  );

  // ── Matrix / rm -rf easter egg ────────────────────────────────────────────────
  if (rmrfActive) {
    return <MatrixScreen onExit={() => setRmrfActive(false)} />;
  }

  const dirPath = curDirPath;

  // ── Render ─────────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: COLORS.bg,
        overflow: "hidden",
        fontFamily: "'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
        fontSize: 13,
        color: COLORS.text,
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* ── Terminal Output ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px 16px",
          lineHeight: 1.65,
        }}
      >
        {lines.map((line) => (
          <div
            key={line.id}
            style={{
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
              minHeight: "1.65em",
            }}
          >
            {line.content}
          </div>
        ))}

        {/* ── Current input row ── */}
        <div style={{ display: "flex", alignItems: "center", flexWrap: "nowrap" }}>
          {getPrompt(dirPath)}
          <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center" }}>
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: COLORS.text,
                fontFamily: "inherit",
                fontSize: "inherit",
                lineHeight: "inherit",
                width: "100%",
                caretColor: COLORS.prompt.green,
                padding: 0,
              }}
            />
          </div>
        </div>

        <div ref={bottomRef} />
      </div>

      {/* ── Status bar ── */}
      <div
        style={{
          height: 22,
          background: "#252525",
          borderTop: "1px solid #1a1a1a",
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <span style={{ color: "#555", fontSize: 11 }}>
          {"/Users/vishnums" + (dirPath.length > 0 ? "/" + dirPath.join("/") : "")}
        </span>
        <span style={{ color: "#555", fontSize: 11 }}>zsh  ·  utf-8</span>
      </div>
    </div>
  );
}

// ── Matrix Easter Egg ──────────────────────────────────────────────────────────
const MATRIX_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()アイウエオカキクケコ";
const EMOJIS = ["\\(o_o)/", "(˚Δ˚)b", "(^-^*)", "(‵′)", "\\(°ˊДˋ°)/"];

function MatrixScreen({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const dropsRef = useRef<number[]>([]);
  const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  const FONT_SIZE = 13;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    const cols = Math.floor(canvas.width / FONT_SIZE);
    dropsRef.current = Array(cols).fill(1);

    const ctx = canvas.getContext("2d")!;

    const draw = () => {
      ctx.fillStyle = "rgba(0,0,0,0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#32d74b";
      ctx.font = `${FONT_SIZE}px "SF Mono", monospace`;

      dropsRef.current.forEach((y, x) => {
        const ch = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
        ctx.fillText(ch, x * FONT_SIZE, y * FONT_SIZE);
      });

      dropsRef.current = dropsRef.current.map((y) =>
        y * FONT_SIZE > canvas.height && Math.random() > 0.975 ? 1 : y + 1
      );

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        background: "#000",
        cursor: "pointer",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onExit}
    >
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          color: "#fff",
          fontFamily: "'SF Mono', monospace",
          textShadow: "0 0 12px #32d74b",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>{emoji}</div>
        <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: 3, color: "#32d74b" }}>
          HOW DARE YOU!
        </div>
        <div style={{ fontSize: 14, marginTop: 12, color: "#aaa" }}>
          Click anywhere to go back
        </div>
      </div>
    </div>
  );
}
