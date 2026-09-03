# RESEMBLE v35 — Backend API Foundation

One-click local production foundation with a zero-dependency Node.js API.

## Start
Double-click `START-RESEMBLE.bat`.

Requires Node.js 18+.

## API
- GET `/api/health`
- GET `/api/products`
- GET `/api/products/:id`
- POST `/api/auth/signup`
- POST `/api/auth/login`
- GET `/api/auth/me`
- POST `/api/auth/logout`
- PUT `/api/account/profile`
- GET/PUT `/api/cart`
- GET/PUT `/api/addresses`
- GET/POST `/api/orders`
- POST/PUT/DELETE `/api/products` endpoints for the management layer

Data is stored in `data/db.json` for this self-contained development build. Passwords use Node's `scrypt` hashing and sessions are HttpOnly cookies.

## Important
Payment gateway, transactional email, cloud database, production secrets, rate limiting, and admin-role hardening are intentionally reserved for the later production stages.
