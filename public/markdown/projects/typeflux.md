# TypeFlux : Native macOS AI Copilot

**macOS Native App** | **AI & Systems**

* **Live Link:** [https://www.type-shit.app/](https://www.type-shit.app/)
* **GitHub Repository:** [vishnums2k5/TypeFlux](https://github.com/vishnums2k5/TypeFlux)
* **Tech Stack:** Swift, SwiftUI, AppKit, macOS Accessibility APIs, OpenAI & Anthropic LLMs

---

### Overview

A native macOS utility that runs invisibly in the background, letting you select text in any app, hit a shortcut, and have AI rewrite it instantly. Uses the Accessibility API to capture and inject text system-wide, streams responses in real time via Swift Concurrency, and supports voice dictation and screenshot-based context.

### Key Features

* **System-Wide Accessibility Injection:** Seamlessly captures and replaces text anywhere on macOS without clipboard pollution.
* **Low Latency Streaming:** Swift Concurrency and streaming completions from OpenAI & Claude.
* **Multimodal Context:** Supports screenshot captures and voice dictation for instant prompt context.
