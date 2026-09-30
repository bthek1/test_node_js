# Roadmap: vertical slices

Each slice is a working feature that runs end to end, from IBKR through the server to the UI, with tests. Build the slices in order. Tick one off only when it works against a paper gateway.

- [ ] **0. Walking skeleton.** Set up the workspaces and scripts. Express `GET /api/health` reports the IBKR connection state and trading mode, and a React page shows it. Includes the connection layer, reconnect handling and one test for each workspace.
- [ ] **1. Account summary.** `GET /api/account/summary`, shown as a card with net liquidation, cash and buying power.
- [ ] **2. Positions.** `GET /api/positions`, shown as a positions table.
- [ ] **3. Symbol search.** `GET /api/contracts/search`, shown as a search box that resolves a `conId`.
- [ ] **4. Live quote.** WS `/ws` subscribe/unsubscribe for one symbol, shown as a quote ticker. This is where the WS hub and the reference-counted subscriptions come in.
- [ ] **5. Watchlist.** Several streamed quotes. Tests that subscriptions are shared across browser tabs.
- [ ] **6. Historical chart.** `GET /api/history/:conId`, shown as a chart for the selected symbol. This is where pacing and throttling come in.
- [ ] **7. Paper orders.** `POST/GET/DELETE /api/orders` with an order ticket, open orders list and streamed `orderStatus`. Includes the guard against live orders.
- [ ] **8. P&L stream.** Streamed `pnl` for the account and positions, shown in the UI.

Add, reorder or split slices here as priorities change.
