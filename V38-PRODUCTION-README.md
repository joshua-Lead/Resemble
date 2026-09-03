# RESEMBLE v38 — Production Launch

This is the final launch-ready codebase in the current roadmap.

## One-click local run
Double-click `START-RESEMBLE.bat`.

## Production run
1. Copy `.env.production.example` to `.env`.
2. Replace the admin email/password with strong unique values.
3. Configure a real payment provider adapter before setting `PAYMENT_MODE=live`.
4. Set `NODE_ENV=production`.
5. Run `START-PRODUCTION.bat` or `node server.js`.

## Production checks included
- Security response headers
- Request body size limit
- Password hashing with Node scrypt
- HttpOnly session cookies
- Server-side cart/product/order validation
- Stock validation and restoration on cancellation
- Admin-only management endpoints
- Health endpoint
- Static path traversal protection
- Clean 404/500 API responses

## Important deployment note
The Node server is the backend/API. Static hosting platforms that only serve HTML/CSS/JS cannot run `server.js` by themselves. Deploy the frontend and backend to platforms that support their respective runtimes, then point the frontend API base URL at the backend.

## Live payments
The included payment flow intentionally defaults to demo authorization. Do not treat demo authorization as real payment collection. A live Razorpay (or other provider) server adapter and merchant credentials must be installed/configured before taking real payments.

## Launch checklist
- Replace demo payment with a real provider
- Add real product images/3D assets
- Configure shipping/return/tax rules
- Configure production domain and HTTPS
- Set secure admin credentials
- Back up `data/db.json` or migrate to a production database
- Test signup, login, cart, checkout, cancellation, refunds, and admin flows in staging
