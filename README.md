# IBKR Dashboard (Express + React)

This is a web app for viewing Interactive Brokers account data and market data, and for placing orders. An Express server connects to a local IB Gateway through the TWS API. A React (Vite) frontend reads that data over REST and WebSocket.

> Status: the docs and plan exist, but the code is not scaffolded yet.

## Prerequisites

- Node.js 22 or newer
- An IBKR account with **paper trading** turned on
- IB Gateway, logged in, with the API socket enabled on port 4002 (see [docs/ibkr-integration.md](docs/ibkr-integration.md))

## Quick start

```bash
npm install
cp .env.example .env
npm run dev        # server :3001, client :5173
```

## Docs

- [Architecture](docs/architecture.md)
- [IBKR integration](docs/ibkr-integration.md)
- [Roadmap (vertical slices)](docs/roadmap.md)
- [Decisions](docs/decisions/)
