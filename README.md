# Red Tetris

Networked multiplayer Tetris (React + Redux + Socket.IO).

The project is two independent npm projects:

- [back/](back/) — Node.js 22 + Express + Socket.IO game server (port `4000`)
- [front/](front/) — React 18 + Redux Toolkit SPA bundled with webpack (port `3000`)

## Run with Docker (no Node install required)

For machines without Node.js (e.g. 42 school PCs), use Docker — no `sudo` needed.

```sh
docker compose up --build
```

Then open:

- <http://localhost:3000/RoomName/PlayerName>            (solo / first player to join a room is the leader)
- <http://localhost:3000/RoomName/AnotherPlayer>         (open in a second tab to play multiplayer)

The URL format is path-based per subject §V.2.1: `http://<host>:<port>/<room>/<player_name>`.

To stop and clean up:

```sh
docker compose down
```

### Configuration

| Variable      | Where     | Default                 | Purpose                                                                 |
| ------------- | --------- | ----------------------- | ----------------------------------------------------------------------- |
| `PORT`        | back      | `4000`                  | Port the game server listens on.                                        |
| `BACKEND_URL` | front     | `http://localhost:4000` | URL the browser uses to reach the back. Baked into the bundle on build. |

The browser runs on the host (not in the container), so the default `http://localhost:4000` works when port `4000` is published. If you reach the back container by a different hostname, override it:

```sh
BACKEND_URL=http://my-host:4000 docker compose up --build
```

You can also set `window.__BACKEND_URL__` before `bundle.js` loads to override at runtime without rebuilding.

`.env` files are **not** copied into the images and remain gitignored.

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
npm start        # webpack-dev-server on :3000
```

## Tests

```sh
cd back  && npm run coverage
cd front && npm run coverage
```

Coverage thresholds (subject §V.2.5): ≥ 70% statements / functions / lines, ≥ 50% branches.

## More

See [CLAUDE.md](CLAUDE.md) for an architecture overview and the canonical socket-event contract.
