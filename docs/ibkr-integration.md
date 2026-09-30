# Interactive Brokers integration

This app uses the **TWS API** through **IB Gateway** (or TWS), with the [`@stoqey/ib`](https://github.com/stoqey/ib) Node client. See [ADR 0001](decisions/0001-ibkr-api-choice.md) for why.

## Local setup

1. Get an IBKR account and turn on a **paper trading** account (Client Portal → Settings → Paper Trading Account).
2. Install **IB Gateway** (stable) from IBKR and log in with your **paper** username.
3. In Gateway, go to Configure → Settings → API → Settings:
   - Enable ActiveX and Socket Clients
   - Socket port: `4002` (paper). Live uses `4001`.
   - Trusted IPs: `127.0.0.1`
   - Keep **Read-Only API** turned on until you need to place orders.
4. Copy `.env.example` to `.env`, then run `npm run dev`. `GET /api/health` should report `connected`.

| Process | Live | Paper |
|---|---|---|
| IB Gateway | 4001 | 4002 |
| TWS | 7496 | 7497 |

## Rules the code must follow

- **Single connection, unique `clientId`.** A second connection with the same `clientId` pushes out the first one. Only `server/src/ibkr/connection.ts` connects.
- **Order IDs** start at the `nextValidId` sent on connect and must strictly increase. Allocate them only in `ibkr/orders.ts`.
- **Contracts by `conId`.** Resolve symbols once with a contract search or `reqContractDetails`, then pass `conId` everywhere else. This avoids ambiguous symbol, exchange or currency combinations.
- **Pacing.** The limit is about 50 API messages per second. Historical data is stricter: no identical requests within 15 seconds, and at most 60 requests per 10 minutes. Queue and throttle requests in the service layer. Pacing violations show up as error events, not thrown exceptions.
- **Market data lines** are limited (100 by default). Share subscriptions across browser clients with reference counts, and cancel them when nobody is watching.
- **No subscription → delayed data.** Call `reqMarketDataType(3)`, or use the configured type, so quotes still arrive about 15 minutes delayed.
- **Disconnects are normal.** IB Gateway restarts daily and may drop the connection at any time. Reconnect with backoff, send the `connection` state over the WebSocket, and resubscribe active streams.
- **Errors are events.** IBKR reports many informational messages through the error channel. For example, codes 2104, 2106 and 2158 mean "data farm connection OK". Log them at debug level. Do not surface them as failures.

## Order safety

- The default is paper mode. A live order requires `IBKR_TRADING_MODE=live` **and** `ALLOW_LIVE_ORDERS=true`. Otherwise `POST /api/orders` returns 403.
- The Gateway's Read-Only API setting is a second, independent safeguard.

## References

- TWS API docs: https://interactivebrokers.github.io/tws-api/
- IBKR Campus API docs: https://www.interactivebrokers.com/campus/ibkr-api-page/twsapi-doc/
- `@stoqey/ib`: https://github.com/stoqey/ib (prefer `IBApiNext`, which is RxJS-based, over the callback-style `IBApi`)
