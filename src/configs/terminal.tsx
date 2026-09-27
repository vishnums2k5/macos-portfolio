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
              Hi, I'm Vishnu M S. Code. Ship. Repeat.
            </div>
            <div className="mt-1 text-gray-300">
              Building AI-powered tools people actually use — from native macOS apps to open source infrastructure.
            </div>
          </div>
        )
      },
      {
        id: "about-interests",
        title: "interests.txt",
        type: "file",
        content: "AI/LLM Applications / Chrome Extensions / Native macOS / Full-Stack & Systems Engineering"
      },
      {
        id: "about-skills",
        title: "skills.txt",
        type: "file",
        content: (
          <div className="py-1 space-y-1">
            <div><span className="text-yellow-300">Languages:</span> Python, JavaScript, TypeScript, Swift, Go</div>
            <div><span className="text-blue-300">AI / LLM:</span> OpenAI, Anthropic, Gemini, RAG pipelines, pgvector, prompt engineering</div>
            <div><span className="text-green-300">Frameworks:</span> React, Next.js, Node.js, SwiftUI, AppKit, Tailwind CSS, Prisma</div>
            <div><span className="text-purple-300">Infra & DB:</span> PostgreSQL, MongoDB, Redis, BullMQ, AWS S3, Docker, Turborepo</div>
          </div>
        )
      },
      {
        id: "about-contact",
        title: "contact.txt",
        type: "file",
        content: (
          <ul className="list-disc ml-6">
            <li>
              Email:{" "}
              <a
                className="text-blue-300"
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
                className="text-blue-300"
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
                className="text-blue-300"
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
                className="text-blue-300"
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
                className="text-blue-300"
                href="https://leetcode.com/u/vishnu2ko5/"
                target="_blank"
                rel="noreferrer"
              >
                vishnu2ko5
              </a>
            </li>
          </ul>
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
