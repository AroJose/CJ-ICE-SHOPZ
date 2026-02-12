# CJ ICE SHOPZ (React + Node.js + MySQL)

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

- MySQL is used for persistence (auto-creates DB + tables on server start).
- Connection defaults: `root` / `root123` at `127.0.0.1:3306` with DB `mini_ecommerce`.
- Configure via `server/.env` (copy from `.env.example`).
- CORS is enabled for local dev.
- Checkout generates a bill and creates an order in MySQL.
- Categories and products can be added from the Admin page.
- Image uploads are stored locally in `server/uploads` and served at `/uploads/*`.
- Admin can edit/delete products, categories, ads, and quotes, and download invoices.
