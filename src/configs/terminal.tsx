import type { TerminalData } from "~/types";

const terminal: TerminalData[] = [
  {
    id: "about",
    title: "about",
    type: "folder",
    children: [
      {
        id: "about-me",
        title: "intro.txt",
        type: "file",
        content: (
          <div className="py-1">
            <div>
              I'm <span className="text-yellow-300 font-semibold">Vishnu M S</span>, a second-year B.Tech CSE (AI & ML) student at Polaris School of Technology.
            </div>
            <div className="mt-2 text-gray-300">
              I build AI-integrated apps in Swift, TypeScript, and Python. My work includes{" "}
              <a className="text-blue-300 underline" href="https://www.type-shit.app/" target="_blank" rel="noreferrer">TypeFlux</a> (native macOS AI copilot),{" "}
              <a className="text-blue-300 underline" href="https://chesswise-web.vercel.app/" target="_blank" rel="noreferrer">ChessWise</a> (chess coach pairing Stockfish with Gemini), and two Chrome extensions, LLM Council and Universal Chat Cleaner, used by 150+ people.
            </div>
            <div className="mt-2 text-gray-400">
              📍 Bengaluru, Karnataka, India
            </div>
          </div>
        )
      },
      {
        id: "about-skills",
        title: "skills.txt",
        type: "file",
        content: (
          <div className="py-1 space-y-1">
            <div><span className="text-yellow-300">Languages:</span> Python, JavaScript, TypeScript, Swift, Go</div>
            <div><span className="text-blue-300">AI & LLM:</span> OpenAI, Anthropic, and Gemini APIs, RAG pipelines, pgvector, Zod</div>
            <div><span className="text-green-300">Frameworks:</span> React, Next.js, Node.js, SwiftUI, AppKit, Tailwind CSS, Prisma</div>
            <div><span className="text-purple-300">Data & Infra:</span> PostgreSQL, MongoDB, Redis, BullMQ, AWS S3, Docker, Turborepo</div>
            <div><span className="text-cyan-300">Tools:</span> Git, GitHub, Postman, Chrome Extensions API</div>
          </div>
        )
      },
      {
        id: "about-contact",
        title: "contact.txt",
        type: "file",
        content: (
          <ul className="list-disc ml-6 space-y-0.5">
            <li>
              Email:{" "}
              <a
                className="text-blue-300 underline"
                href="mailto:vishnusajeev2005@gmail.com"
                target="_blank"
                rel="noreferrer"
              >
                vishnusajeev2005@gmail.com
              </a>
            </li>
            <li>
              GitHub:{" "}
              <a
                className="text-blue-300 underline"
                href="https://github.com/vishnums2k5"
                target="_blank"
                rel="noreferrer"
              >
                @vishnums2k5
              </a>
            </li>
            <li>
              LinkedIn:{" "}
              <a
                className="text-blue-300 underline"
                href="https://www.linkedin.com/in/vishnu-m-s-0358802a1/"
                target="_blank"
                rel="noreferrer"
              >
                Vishnu M S
              </a>
            </li>
            <li>
              X:{" "}
              <a
                className="text-blue-300 underline"
                href="https://x.com/vishnums2k5"
                target="_blank"
                rel="noreferrer"
              >
                @vishnums2k5
              </a>
            </li>
            <li>
              LeetCode:{" "}
              <a
                className="text-blue-300 underline"
                href="https://leetcode.com/u/vishnu2ko5/"
                target="_blank"
                rel="noreferrer"
              >
                vishnu2ko5
              </a>
            </li>
          </ul>
        )
      },
      {
        id: "about-resume",
        title: "resume.txt",
        type: "file",
        content: (
          <div className="py-1">
            <span>Download resume (PDF): </span>
            <a
              className="text-blue-300 underline"
              href="/Vishnu_Resume.pdf"
              target="_blank"
              rel="noreferrer"
            >
              Vishnu_Resume.pdf
            </a>
          </div>
        )
      }
    ]
  },
  {
    id: "about-dream",
    title: "my-dream.cpp",
    type: "file",
    content: (
      <div className="py-1">
        <div>
          <span className="text-yellow-400">while</span>(
          <span className="text-blue-400">shipping</span>) <span>{"{"}</span>
        </div>
        <div>
          <span className="text-blue-400 ml-9">impact</span>
          <span className="text-yellow-400">++</span>;
        </div>
        <div>
          <span>{"}"}</span>
        </div>
      </div>
    )
  }
];

export default terminal;
