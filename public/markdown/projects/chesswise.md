# ChessWise : Personalized AI Chess Coach & Adaptive Training

**Web Application & Engine Analysis** | **AI & Gaming**

* **Live Link:** [https://chesswise-web.vercel.app/](https://chesswise-web.vercel.app/)
* **GitHub Repository:** [vishnums2k5/chesswise](https://github.com/vishnums2k5/chesswise)
* **Tech Stack:** TypeScript, Node.js, Google Gemini, pgvector, PostgreSQL, Prisma, BullMQ, Redis, Stockfish 18

---

### Overview

An AI chess coach that combines deterministic Stockfish evaluations with Gemini to explain blunders in plain English — with zero hallucinations. Uses a RAG pipeline to ground coaching in a player's own game history and an SM-2 spaced-repetition system to turn mistakes into personalized puzzle drills.

### Key Features

* **Ground-Truth Evaluation:** Combines Stockfish 18 deterministic calculations with Gemini language modeling for hallucination-free explanations.
* **Personalized RAG Coaching:** Ingests user game archives into pgvector to detect recurring player weaknesses.
* **SM-2 Spaced-Repetition Drills:** Converts recurring blunder patterns into daily customized puzzle sets.
