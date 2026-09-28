import type { BearData } from "~/types";

const bear: BearData[] = [
  {
    id: "profile",
    title: "Profile",
    icon: "i-ph:paw-print",
    md: [
      {
        id: "about-me",
        title: "About Me",
        file: "markdown/about-me.md",
        icon: "i-ph:shield-star",
        excerpt: "B.Tech CSE (AI & ML) student at Polaris School of Technology."
      },
      {
        id: "github-stats",
        title: "GitHub Stats",
        file: "markdown/github-stats.md",
        icon: "i-fa6-brands:github",
        excerpt: "Live activity and top languages across GitHub."
      },
      {
        id: "about-site",
        title: "About This Site",
        file: "markdown/about-site.md",
        icon: "i-ph:browser",
        excerpt: "macOS Tahoe Liquid Glass portfolio in React & TypeScript."
      }
    ]
  },
  {
    id: "project",
    title: "Projects",
    icon: "i-ph:git-branch",
    md: [
      {
        id: "llm-council",
        title: "LLM Council",
        file: "markdown/projects/llm-council.md",
        icon: "i-ph:cpu",
        excerpt: "Broadcast one prompt across all open AI tabs at once.",
        link: "https://github.com/vishnums2k5/LLM-Council-Extension"
      },
      {
        id: "chat-cleaner",
        title: "Universal Chat Cleaner",
        file: "markdown/projects/chat-cleaner.md",
        icon: "i-ph:trash",
        excerpt: "Bulk-delete chats across 14+ AI platforms.",
        link: "https://github.com/vishnums2k5/universal-chat-cleaner"
      },
      {
        id: "udemy-plus",
        title: "Udemy+",
        file: "markdown/projects/udemy-plus.md",
        icon: "i-ph:graduation-cap",
        excerpt: "Supercharge Udemy with OCR, speed controls & spaced repetition.",
        link: "https://chromewebstore.google.com/detail/udemy+/bpadgjdolghconmajanagnpcdobgaiia"
      },
      {
        id: "typeflux",
        title: "TypeFlux Copilot",
        file: "markdown/projects/typeflux.md",
        icon: "i-ph:command",
        excerpt: "AI text rewriter for any macOS app via Accessibility API.",
        link: "https://github.com/vishnums2k5/TypeFlux"
      },
      {
        id: "chesswise",
        title: "ChessWise AI Coach",
        file: "markdown/projects/chesswise.md",
        icon: "i-ph:trophy",
        excerpt: "Stockfish 18 + Gemini RAG for zero-hallucination blunder analysis.",
        link: "https://github.com/vishnums2k5/chesswise"
      },
      {
        id: "repeat",
        title: "Repeat DSA",
        file: "markdown/projects/repeat.md",
        icon: "i-ph:repeat",
        excerpt: "Spaced-repetition tracker for LeetCode interview prep.",
        link: "https://github.com/vishnums2k5/dsa-tracker-repeat"
      },
      {
        id: "audioflow",
        title: "AudioFlow",
        file: "markdown/projects/audioflow.md",
        icon: "i-ph:headphones",
        excerpt: "Modern Android music player with Jetpack Compose & Media3.",
        link: "https://github.com/vishnums2k5/AudioFlow"
      },
      {
        id: "habit-tracker",
        title: "Habit Tracker",
        file: "markdown/projects/habit-tracker.md",
        icon: "i-ph:check-circle",
        excerpt: "Track daily habits and streaks with a clean web UI.",
        link: "https://github.com/vishnums2k5/Habit-Tracker"
      }
    ]
  }
];

export default bear;
