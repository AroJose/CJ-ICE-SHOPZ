# CJ ICE SHOPZ (React + Node.js + Postgres)

## Quick Start

1) Server
```
cd server
npm install
npm run dev
```

2) Client (new terminal)
```
cd client
npm install
npm run dev
```

Open the Vite URL printed in the client terminal.

## Default Admin

- Email: admin@example.com
- Password: admin123

## Notes

- Postgres is used for persistence (auto-creates tables on server start).
- Use `DATABASE_URL` for deployment (Render Postgres provides this).
- Local fallback config is available via `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
- Configure via `server/.env` (copy from `.env.example`).
- CORS is enabled for local dev.
- Checkout generates a bill and creates an order in Postgres.
- Categories and products can be added from the Admin page.
- Image uploads are stored locally in `server/uploads` and served at `/uploads/*`.
- Admin can edit/delete products, categories, ads, and quotes, and download invoices.
