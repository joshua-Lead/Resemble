# RESEMBLE v36 — Admin + Inventory + Orders

## Run
Double-click `START-RESEMBLE.bat`.

Open `http://127.0.0.1:8787/admin.html`.

## Demo admin
Email: `admin@resemble.local`
Password: `ResembleAdmin123!`

Change these defaults in production using `RESEMBLE_ADMIN_EMAIL` and `RESEMBLE_ADMIN_PASSWORD` environment variables before first admin creation.

## Added
- Role-based admin sessions
- Admin-only product mutations
- Dashboard metrics
- Inventory stock updates
- Order list + status workflow
- Automatic stock restoration when an order is cancelled
- Customer list
- Existing v35 API, cart, wishlist, auth, account and 3D experience preserved
