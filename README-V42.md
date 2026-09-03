# RESEMBLE v42 — Launch Control Pack

v42 is the launch-control layer on top of v41. It does not invent merchant credentials or deploy into a cloud account automatically; it prepares and validates the final production environment so the real store can be switched live safely.

### Included
- Production environment validator
- Local database backup helper
- Final launch checklist
- One-click final environment check + start
- Existing v41 app, Docker, Railway and Render deployment files preserved

### Quick local run
Run `START-FINAL-CHECK.bat` after creating `.env.production` from `.env.production.example`.

For real payments, configure live Razorpay credentials only in your hosting platform's secret manager/environment variables.
