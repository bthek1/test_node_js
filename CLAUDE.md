# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This is a new project. Only the docs exist so far. The plan is an Express (Node.js, TypeScript) backend plus a React (Vite) frontend that connects to Interactive Brokers (IBKR). When you scaffold or change the structure, update this file and `docs/` to match what the code actually does.

- `docs/architecture.md`: system layout, data flow and API surface
- `docs/ibkr-integration.md`: IBKR connection setup, constraints and gotchas (read this before touching broker code)
- `docs/decisions/`: architecture decision records (ADRs). Add a new one when a decision changes.
- `docs/roadmap.md`: the ordered list of vertical slices and which one is next

## How to develop: vertical slices

Build one working feature at a time, top to bottom. Do not build the project layer by layer.

- A slice delivers one user-visible capability through every layer it needs: IBKR service → Express route or WS message → shared type → React UI → tests. When the slice is done, it runs end to end with `npm run dev` against a paper gateway.
- Do not build ahead. Don't write services, routes, types, components or config that the current slice doesn't use. Create folders from the planned layout in `docs/architecture.md` only when a slice needs them.
- Keep slices small enough to finish and commit in one sitting. If a slice grows, split it into smaller slices that each still deliver something usable. Don't split it into "backend now, frontend later".
- Each slice includes its tests: a mocked `ibkr/` service for route and WS tests, and a component test if the UI has logic. It also includes any doc updates, such as this file, `docs/architecture.md` and the roadmap checkbox.
- Refactor shared pieces (throttling, the subscription registry, error mapping) when a second slice needs them, not before.
- Before starting work, check `docs/roadmap.md` for the next slice. When it is done, confirm it works, tick it off, and stop for review before starting the next one.

## Commands (planned: npm workspaces at the repo root)

```bash
npm install                      # install all workspaces
npm run dev                      # server (tsx watch) + client (vite) together
npm run dev -w server            # backend only, http://localhost:3001
npm run dev -w client            # frontend only, http://localhost:5173 (proxies /api and /ws to :3001)
npm run build                    # build both
npm run lint                     # eslint across workspaces
npm run typecheck                # tsc --noEmit across workspaces
npm test                         # vitest across workspaces
npm test -w server -- src/routes/orders.test.ts      # one test file
npm test -w server -- -t "rejects live orders"       # tests matching a name
```

Node 25 / npm 11 are installed locally.

## Architecture (big picture)

```
React (client/)  --HTTP /api/*-->  Express (server/)  --TCP socket-->  IB Gateway / TWS  -->  IBKR
                 <--WebSocket /ws--                   (@stoqey/ib)
```

- **Only the server talks to IBKR.** The browser never holds broker credentials and never connects to the gateway. The client uses REST for request/response calls (account, positions, orders, historical bars) and a WebSocket for streams (quotes, order status, P&L).
- **One shared broker connection.** `server/src/ibkr/` owns a single `IBApiNext` connection with a fixed `clientId`. Routes and socket handlers go through the service layer in that folder. They never create their own connections. The connection layer handles reconnecting, and `/api/health` reports the connection state.
- **Stream fan-out.** Market-data subscriptions are reference-counted in the server. Many browser clients watching one symbol share a single IBKR subscription, and it is cancelled when the last watcher leaves. This matters because IBKR limits concurrent market-data lines.
- **Order safety.** The server defaults to the paper account (gateway port 4002). Live order placement must be turned on explicitly with `IBKR_TRADING_MODE=live` and `ALLOW_LIVE_ORDERS=true`. Do not weaken this guard.
- **Shared types.** DTOs used by both sides (quotes, positions, orders, WS message envelopes) belong in `shared/` so the REST and WS contracts cannot drift. Validate inbound requests with zod at the route boundary.

## IBKR constraints to keep in mind

Full details are in `docs/ibkr-integration.md`. The key rules:
- IB Gateway or TWS must be running and logged in, with the API socket enabled. Ports: Gateway 4001 live / 4002 paper; TWS 7496 live / 7497 paper.
- Order IDs must start from `nextValidId` and increase. Request IDs must be unique per connection.
- Pacing limit is about 50 messages per second, and historical-data requests have stricter limits. Throttle requests in the service layer, not in the routes.
- Without market-data subscriptions, request delayed data (`reqMarketDataType(3)`) rather than failing.
- The gateway restarts daily, so the server must treat disconnects as normal and resubscribe active streams after it reconnects.
- Tests must never hit a real gateway. Mock the `ibkr/` service layer.
