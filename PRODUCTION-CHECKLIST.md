# Production checklist

[ ] GitHub main branch is current
[ ] DATABASE_URL points to managed PostgreSQL
[ ] Admin password is unique
[ ] PAYMENT_MODE=demo during initial deployment
[ ] HTTPS domain configured
[ ] APP_BASE_URL matches public origin
[ ] /health returns 200
[ ] /api/products returns 200
[ ] Signup/login works
[ ] Cart and checkout work in demo mode
[ ] Razorpay test/live keys verified before live mode
[ ] Razorpay webhook URL + secret configured
[ ] SMTP test message received
[ ] Admin order status update tested
[ ] Backup/restore policy configured for database
[ ] Custom domain DNS verified
[ ] Final mobile + desktop smoke test passed
