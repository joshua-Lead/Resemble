# RESEMBLE v41 — Production Deployment Bundle

This bundle prepares the v40 application for deployment to a Node/Docker host.

## Included
- `/health` and `/api/health` readiness endpoints
- Docker image healthcheck
- Docker Compose app healthcheck
- Railway config-as-code (`railway.toml`)
- Render blueprint (`render.yaml`)
- Production verification script (`DEPLOY-CHECK.py`)
- One-click Windows production starter
- Existing Razorpay, PostgreSQL, SMTP, admin, cart, wishlist and 3D systems preserved

## Deploy
1. Push the repository to GitHub.
2. Choose a Node/Docker host and connect the repository.
3. Add the required environment variables from `.env.production.example`.
4. Configure `APP_BASE_URL` to the final HTTPS URL.
5. Keep `PAYMENT_MODE=demo` until Razorpay keys/webhook are verified end-to-end.
6. Run `DEPLOY-CHECK.py` against the deployed URL.

## Cloudflare custom domain
Cloudflare Tunnel can publish the deployed/local Node service behind a public hostname. The tunnel maps a hostname to the origin service; use a production tunnel rather than a quick tunnel.

## Required production secrets
`DATABASE_URL`, `RESEMBLE_ADMIN_EMAIL`, `RESEMBLE_ADMIN_PASSWORD`, and (when going live) Razorpay key/webhook secrets. SMTP variables are required for outgoing order email.

No live credentials are embedded in this ZIP.
