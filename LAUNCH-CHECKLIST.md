# RESEMBLE — Final Launch Checklist

## Before going live
- Set `NODE_ENV=production`.
- Replace all demo/admin credentials.
- Generate a long random `SESSION_SECRET` (32+ characters).
- Add real Razorpay live keys only in the hosting provider's secret/environment settings.
- Configure Razorpay webhook secret and webhook URL.
- Configure production PostgreSQL and take a backup before migration.
- Configure SMTP sender credentials for order notifications.
- Set the real `PUBLIC_BASE_URL` / store URL.
- Add real products, prices, images, sizes, stock, shipping and return policy.

## Functional smoke test
1. Open home/shop.
2. Open a product and select variant/size.
3. Add to cart and verify quantity updates.
4. Add/remove wishlist item.
5. Sign up/sign in.
6. Add a shipping address.
7. Create a test payment in Razorpay test mode.
8. Confirm order is created exactly once and stock changes once.
9. Open account and admin order views.
10. Confirm webhook processing is idempotent.

## Go-live gate
Do not enable live payments until the smoke test passes on the deployed environment, HTTPS is active, and the production database has a verified backup/restore path.
