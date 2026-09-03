# RESEMBLE v40 — Live Commerce Setup

## 1) Local one-click
Run `START-V40.bat`. Demo payments work without credentials.

## 2) Production database
Run with Docker using `START-V40-DOCKER.bat`, which starts PostgreSQL + RESEMBLE.
For managed hosting, set `DATABASE_URL` to your managed PostgreSQL connection string.

## 3) Razorpay live mode
Set `PAYMENT_MODE=live`, `PAYMENT_PROVIDER=Razorpay`, `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env.production`.
The browser receives only the Key ID. The Key Secret stays server-side.
Razorpay requires a server-created order and server-side signature verification before fulfillment.

## 4) Webhook
Set your Razorpay webhook endpoint to:
`https://YOUR-DOMAIN/api/payment/webhook`
Use the same `RAZORPAY_WEBHOOK_SECRET` in the app and Razorpay dashboard.

## 5) Email
Add SMTP variables to send order confirmation/status emails. Without SMTP, checkout still works and notification status is recorded in the order.

## 6) Production checklist
Change the admin password, use HTTPS, set a real APP_BASE_URL, use live Razorpay keys only after testing, configure payment capture, and verify the webhook signature/endpoint.
