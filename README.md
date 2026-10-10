# CardStudio Digital Business Card SaaS

CardStudio is a production-oriented Digital Business Card SaaS platform with a Next.js frontend, Express API, MySQL schema, QR code generation, vCard downloads, public profile URLs, user card management, and a protected Super Admin area.

## Structure

- `frontend/` - Next.js, React, TypeScript, Tailwind CSS.
- `backend/` - Express, TypeScript, REST API, auth, QR/vCard, uploads, admin routes.
- `database/` - MySQL migrations and seed SQL.
- `deploy/` - PM2 and Nginx examples for a Hostinger VPS.
- `digital-business-card-templates/` - original uploaded design-reference prototype. It is preserved.

## Current Implementation

- Landing page with SaaS positioning and featured template previews.
- Register, login, logout, forgot-password, and reset-password flows.
- Authenticated dashboard with card counts, search, duplicate, edit, and delete.
- 25-template gallery with search/category filtering.
- Guided editor for profile details, design customization, social links, QR publishing, and vCard download.
- Shared card data model rendered across all templates.
- Public `/card/[slug]` pages with metadata, sharing, QR, and Add to Contacts.
- Express endpoints for auth, cards, templates, uploads, public cards, QR/vCard, and admin.
- MySQL schema covering users, cards, templates, social links, media, resets, sessions, and audit logs.
- Backend tests for auth, authorization/ownership, template count, draft/public visibility, QR, and vCard.

## Prerequisites

- Node.js 20 LTS recommended.
- MySQL 8+.
- PM2 and Nginx for production deployment.

## Local Setup

```bash
npm install
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env.local
```

Edit `backend/.env` with your local MySQL credentials. The default frontend expects the API at `http://localhost:4000/api`.

## Database

Create the database and run migrations:

```bash
npm run db:migrate
npm run db:seed
```

Seeded development accounts:

- Admin: `admin@example.com` / `Admin123!`
- User: `demo@example.com` / `User12345!`

Do not use these credentials in production.

## Development

Run both apps:

```bash
npm run dev
```

Or run separately:

```bash
npm run dev --workspace backend
npm run dev --workspace frontend
```

Frontend: `http://localhost:3000`
Backend health check: `http://localhost:4000/health`

## Tests and Builds

```bash
npm run test
npm run build
```

Backend tests use an in-memory store when `NODE_ENV=test`, so they do not require a MySQL database.

## API Summary

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

Cards:

- `POST /api/cards`
- `GET /api/cards`
- `GET /api/cards/:id`
- `PUT /api/cards/:id`
- `POST /api/cards/:id/duplicate`
- `POST /api/cards/:id/publish`
- `POST /api/cards/:id/unpublish`
- `DELETE /api/cards/:id`
- `GET /api/cards/:id/qr.png`
- `GET /api/cards/:id/qr.svg`
- `GET /api/cards/:id/vcard.vcf`

Public:

- `GET /api/public/cards/:slug`
- `GET /api/public/cards/:slug/qr.png`
- `GET /api/public/cards/:slug/qr.svg`
- `GET /api/public/cards/:slug/vcard.vcf`

Templates:

- `GET /api/templates`
- `GET /api/templates/categories`
- `GET /api/templates/:id`

Admin:

- `GET /api/admin/overview`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:id/status`
- `GET /api/admin/cards`
- `GET /api/admin/templates`
- `PATCH /api/admin/templates/:id`

## Production Deployment Notes

1. Upload the workspace to your VPS, for example `/var/www/cardstudio`.
2. Install dependencies with `npm ci`.
3. Configure `backend/.env` and `frontend/.env.local` with production URLs and secrets.
4. Run `npm run db:migrate` and `npm run db:seed` only after reviewing the seed behavior.
5. Build with `npm run build`.
6. Start with PM2:

```bash
pm2 start deploy/ecosystem.config.cjs
pm2 save
```

7. Copy `deploy/nginx-cardstudio.conf` into Nginx sites, update `server_name`, enable it, and reload Nginx.
8. Use Certbot or Hostinger's SSL tooling to issue HTTPS certificates.

## Security Notes

- Passwords are hashed with bcrypt.
- Auth uses signed tokens and HTTP-only cookies plus bearer-token support.
- API validates request payloads with Zod.
- Card ownership is checked server-side for private card operations.
- Auth-sensitive routes are rate limited.
- Uploads are limited to common image MIME types and safe generated filenames.
- Production `.env` values must use strong random secrets and least-privilege MySQL credentials.

## Backup and Recovery

- Back up MySQL daily with `mysqldump`.
- Back up the upload directory alongside the database.
- Test restore steps on a staging server before relying on the backup plan.
- Keep `.env` files outside source control.

## Troubleshooting

- If frontend pages cannot load data, verify `NEXT_PUBLIC_API_BASE_URL`.
- If login fails after deployment, verify `JWT_SECRET`, CORS `FRONTEND_ORIGIN`, and HTTPS cookie settings.
- If uploads fail, check `UPLOAD_DIR` exists and is writable by the Node process.
- If migrations fail, confirm the MySQL user can create tables and foreign keys.
