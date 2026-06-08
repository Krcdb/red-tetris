# Red Tetris

A networked, real-time **multiplayer Tetris** played in the browser. Players join a
room through a URL, share the exact same sequence of pieces, and race each other:
clearing several lines at once drops indestructible **penalty lines** onto your
opponents. Each player also sees a live **spectre** (shadow) of every rival's board.

The whole game runs over **Socket.IO** — the server is authoritative (it owns the
game loop, gravity, collisions and scoring) and the React client only renders state
and forwards keystrokes.


## Features

- **Solo & multiplayer** in the same codebase (solo = a room with one player).
- **Room-based matchmaking** via path URLs — the first player in a room is the **leader**
  and is the only one who can launch / relaunch the game.
- **Fair play**: one deterministic piece sequence shared by every player in a room.
- **Penalty lines**: clearing `n` lines pushes `n-1` indestructible lines to opponents.
- **Spectres**: each player sees the silhouette of every opponent's stack.
- **No joins mid-game**; leader promotion is automatic when the leader leaves.
- **Four game modes** (chosen per room):

  | Mode         | Effect                                                            |
  | ------------ | ---------------------------------------------------------------- |
  | `normal`     | Standard rules, 500 ms gravity.                                  |
  | `invisible`  | Locked pieces become invisible — track your stack from memory.  |
  | `no-preview` | No "next piece" preview.                                         |
  | `speed`      | Gravity accelerates as players clear more lines.                |

## Tech stack

| Layer      | Stack                                                                          |
| ---------- | ------------------------------------------------------------------------------ |
| Frontend   | React 18, Redux Toolkit, React Router 7, Socket.IO client, webpack, TypeScript |
| Backend    | Node.js ≥ 22, Express 5, Socket.IO, TypeScript (ESM, run via `tsx`)            |
| Realtime   | Socket.IO (one authoritative server loop, no REST gameplay API)                |
| Tests      | Vitest + coverage (jsdom + Testing Library on the front)                       |
| Tooling    | ESLint (typescript-eslint, perfectionist) + Prettier                           |

The repo is **two independent npm projects** (no root workspace):

- [back/](back/) — game server, listens on port `4000`
- [front/](front/) — React SPA, dev server on port `3000`

## Controls

| Key       | Action          |
| --------- | --------------- |
| ← / →     | Move left/right |
| ↓         | Soft drop       |
| ↑         | Rotate          |
| Space     | Hard drop       |

## Run with Docker (no Node install required)

For machines without Node.js (e.g. 42 school PCs), use Docker — no `sudo` needed.

```sh
docker compose up --build
```

Then open two tabs:

- <http://localhost:3000/RoomName/PlayerName>     (first player to join a room is the leader)
- <http://localhost:3000/RoomName/AnotherPlayer>  (a second tab to play multiplayer)

The URL format is path-based per subject §V.2.1: `http://<host>:<port>/<room>/<player_name>`.
Append `?mode=invisible` (or `no-preview` / `speed`) to pick a game mode for the room.

Stop and clean up:

```sh
docker compose down
```

### Configuration

| Variable      | Where | Default                 | Purpose                                                          |
| ------------- | ----- | ----------------------- | ---------------------------------------------------------------- |
| `PORT`        | back  | `4000`                  | Port the game server listens on.                                 |
| `BACKEND_URL` | front | `http://localhost:4000` | URL the browser uses to reach the back. Baked into the bundle.   |

The browser runs on the host (not in the container), so the default `http://localhost:4000`
works when port `4000` is published. To reach the back by a different hostname:

```sh
BACKEND_URL=http://my-host:4000 docker compose up --build
```


## Run natively (without Docker)

You need Node.js ≥ 22. Run the back and the front in two terminals.

```sh
# terminal 1
cd back
npm install
npm run dev      # tsx watch on :4000
```

```sh
# terminal 2
cd front
npm install
npm start        # webpack-dev-server on :3000 (opens the browser)
```

## Tests

```sh
cd back  && npm run coverage
cd front && npm run coverage
```

Coverage thresholds (subject §V.2.5): ≥ 70% statements / functions / lines, ≥ 50% branches.

## Project layout

```
.
├── back/         # Express + Socket.IO authoritative game server
│   └── src/core/ # match (lobby), game (lifecycle), tetris (loop), classes (Game/Piece/Player)
├── front/        # React + Redux SPA
│   └── src/      # components, redux slices, services/socketService.ts
├── subject.md    # project requirements (source of truth)
├── evaluation.md # grading grid (reference-only)
└── CLAUDE.md     # architecture overview + socket-event contract
```
