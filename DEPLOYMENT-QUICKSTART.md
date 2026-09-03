# RESEMBLE v39 — Production Launch Bundle

## Local production run
1. Copy `.env.production.example` to `.env.production`.
2. Change the admin email/password.
3. Keep `PAYMENT_MODE=demo` until a real provider adapter is connected and verified.
4. Run:
   `docker compose up --build`
5. Open `http://localhost:8787`.

## Node-only run
- Install Node.js 20+.
- Copy `.env.production.example` to `.env.production` and configure it.
- Run `node server.js`.

## Deployment contract
The server is a standard Node HTTP application. Deploy the whole repository to a Node-capable host, expose the configured `PORT`, and set the environment variables in the host dashboard.

## Before accepting real payments
The current checkout has a deliberate demo-payment fallback. Do not set live credentials and assume live charging is enabled. `server.js` still returns `LIVE_PROVIDER_ADAPTER_REQUIRED` until a verified server-side payment provider implementation is added.

## Data
For the current JSON database implementation, persist the `data/` directory so orders, users, products and addresses are not lost on container replacement. For a higher-scale production deployment, move this data layer to a managed database.
