# 0001: Use the TWS API through IB Gateway

- Status: Accepted
- Date: 2026-09-30

## Context

IBKR offers several ways for a Node.js backend to integrate:

1. **TWS API** (TCP socket to a local IB Gateway or TWS). This is the most complete API, with streaming quotes, orders and account updates. It has a maintained Node client, `@stoqey/ib`.
2. **Client Portal / Web API** (REST and WebSocket through the local Client Portal Gateway). It is plain HTTP, but it needs a browser login and a session keep-alive, and it covers less than the TWS API.
3. **Web API with OAuth**. This fits a hosted multi-user app, but it is mainly available to institutional and third-party registered developers.

## Decision

Use option 1: the TWS API through IB Gateway, with `@stoqey/ib` (`IBApiNext`) in the Express server.

## Consequences

- IB Gateway must be running and logged in wherever the server runs. The app never handles IBKR credentials.
- We must handle daily Gateway restarts, pacing limits and order ID allocation ourselves (see `../ibkr-integration.md`).
- All broker access stays in `server/src/ibkr/`. If we switch to the Web API later, only that layer changes and the REST and WS contracts to the client stay the same.
