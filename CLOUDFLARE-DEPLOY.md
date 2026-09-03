# RESEMBLE v43 — Cloudflare Full Stack

## Architecture
- Cloudflare Workers: API + backend
- Cloudflare Static Assets: frontend
- Cloudflare D1: database
- Razorpay: optional live payments

## Dashboard setup
1. Create a D1 database named `resemble-db` in Cloudflare.
2. Copy its database ID into `wrangler.toml` replacing `REPLACE_WITH_D1_DATABASE_ID`.
3. Set a strong `RESEMBLE_ADMIN_PASSWORD` in Cloudflare Worker Variables/Secrets.
4. For live payments, set `PAYMENT_MODE=live` and add Razorpay secrets (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`).
5. Deploy the GitHub repository using the Workers Builds / Cloudflare deploy flow.

## Free-tier note
Workers Free currently includes 100,000 requests/day. D1 Free currently includes 5 million rows read/day, 100,000 rows written/day and 5 GB total storage. Cloudflare enforces those free D1 limits; exceeding them causes D1 requests to fail until the quota resets or the plan is upgraded.
