# RESEMBLE v43 — Cloudflare Full Stack

Single deployment target: Cloudflare Worker + Static Assets + D1.

Do not put live payment credentials in Git. Use Cloudflare Secrets/Variables.

The local Node backend remains available for offline/local development, while `worker.js` is the production serverless API.
