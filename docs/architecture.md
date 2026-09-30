# Architecture

## Overview

```
┌──────────────┐  HTTP /api/*   ┌──────────────────┐  TCP socket   ┌──────────────────┐
│ React client │ ─────────────▶ │ Express server   │ ────────────▶ │ IB Gateway / TWS │ ──▶ IBKR
│ (Vite)       │ ◀───────────── │ (Node, TS)       │ ◀──────────── │ (local process)  │
└──────────────┘  WebSocket /ws └──────────────────┘ @stoqey/ib    └──────────────────┘
```

## Target repository layout

This is where the code ends up. Each folder is created only when a slice in [roadmap.md](roadmap.md) needs it.

```
package.json            # npm workspaces: server, client, shared
server/
  src/
    index.ts            # starts HTTP + WS servers, connects to IBKR
    config.ts           # env parsing (zod); trading mode, ports, clientId
    ibkr/               # the only code that imports @stoqey/ib
      connection.ts     # single IBApiNext instance, reconnect, state
      marketData.ts     # ref-counted quote subscriptions
      orders.ts         # order ID allocation, live-order guard
      account.ts        # summary, positions, P&L
    routes/             # Express routers (thin; validate + call ibkr/)
    ws/                 # WebSocket hub: subscribe/unsubscribe, broadcast
client/
  src/
    api/                # typed fetch wrappers + WS client
    features/           # account, positions, watchlist, orders, charts
shared/
  src/                  # DTOs and WS message types used by both sides
docs/
```

## Server layers

1. **Routes (`routes/`)** parse and validate input with zod, call a service and map errors to HTTP status codes. They contain no IBKR logic.
2. **IBKR services (`ibkr/`)** wrap `IBApiNext` observables. They own request IDs, pacing and throttling, subscription reference counts and order ID allocation.
3. **Connection (`ibkr/connection.ts`)** is a single long-lived connection. It exposes the connection state (`connected`, `disconnected` or `reconnecting`) and re-establishes active subscriptions after a reconnect.

## API surface (initial)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Server and IBKR connection status, trading mode |
| GET | `/api/account/summary` | Net liquidation, cash, buying power |
| GET | `/api/positions` | Current positions |
| GET | `/api/contracts/search?q=` | Symbol lookup, which returns `conId` |
| GET | `/api/history/:conId?bar=&duration=` | Historical bars |
| GET | `/api/orders` | Open orders |
| POST | `/api/orders` | Place an order (blocked in live mode unless explicitly allowed) |
| DELETE | `/api/orders/:id` | Cancel an order |

### WebSocket `/ws`

Every message is JSON with a `type` field. The types are defined in `shared/`.

- Client → server: `{ type: "subscribe", channel: "quote", conId }`, `{ type: "unsubscribe", ... }`
- Server → client: `quote`, `orderStatus`, `pnl`, `connection` (broker connection state changes)

## Configuration (env)

| Var | Default | Notes |
|---|---|---|
| `PORT` | `3001` | Express port |
| `IBKR_HOST` | `127.0.0.1` | Gateway host |
| `IBKR_PORT` | `4002` | 4002 = Gateway paper, 4001 = Gateway live, 7497/7496 = TWS |
| `IBKR_CLIENT_ID` | `1` | Must be unique among the gateway's API clients |
| `IBKR_TRADING_MODE` | `paper` | `paper` or `live` |
| `ALLOW_LIVE_ORDERS` | `false` | Must be `true` **and** mode `live` to place real orders |
| `IBKR_MARKET_DATA_TYPE` | `3` | 1 = live, 3 = delayed |

Keep secrets in `.env` (git-ignored) and commit `.env.example`. IBKR credentials are entered into IB Gateway itself, never into this app.

## Testing

- Vitest in every workspace. The server uses supertest for routes.
- The `ibkr/` layer is mocked in route and WS tests, so there is no gateway in CI.
- Optional manual integration checks can run against a paper gateway, behind `IBKR_INTEGRATION=1`.
