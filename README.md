# Chess

TypeScript React chess app with **React**, **react-chessboard**, **Material UI**, **chess.js**, and **Stockfish.js**. Uses Lichess **cardinal** piece set.

## Setup

```bash
npm install
npm run dev
```

Stockfish worker files are copied from `node_modules/stockfish/bin` to `public/` on `npm run dev` and `npm run build`. If the engine fails to load, ensure `public/stockfish-18-lite-single.js` and `public/stockfish-18-lite-single.wasm` exist (run `npm run copy-stockfish`).

## Structure

- **Game**
  - **Game with friend** – two players, no engine. When the game is over, an **Analyze** button appears and opens Tools → Analyze game with the final position.
  - **Game with Stockfish** – same as friend (engine off during play). **Analyze** after game over.
- **Tools**
  - **Analyze game** – play through a game with an optional engine toggle. Engine shows top lines and best-move arrow.
  - **Set position** – set a FEN position (e.g. for puzzles) with optional engine toggle.

## Layout

- Board width: **350px**, centered with annotations/engine lines.
- **Web (md+):** annotations and engine lines to the **right** of the board.
- **Mobile:** annotations and engine lines **below** the board.

## Scripts

- `npm run dev` – start dev server (copies Stockfish, then Vite).
- `npm run build` – copy Stockfish, type-check, and build for production.
- `npm run preview` – serve production build.
- `npm run copy-stockfish` – copy Stockfish worker files to `public/`.
