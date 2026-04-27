---
inclusion: manual
---

# SaasMasterPro — Panduan Lengkap

## File Wajib Baca Per Kategori

### Autentikasi & Session
- `src/lib/auth.ts` — full NextAuth config (providers, callbacks, JWT)
- `src/lib/auth.config.ts` — edge-safe config untuk proxy
- `src/proxy.ts` — routing protection & session validation
- `src/lib/services/two-factor.ts` — TOTP & backup codes

### Database & Model
- `prisma/schema.prisma` — semua model, relasi, index
- `src/lib/db.ts` — Prisma client singleton
- Migration terbaru di `prisma/migrations/`

### API Routes
- `src/lib/api-utils.ts` — `apiHandler`, `requireAuth`, `requireSuperAdmin`, `parseBody`
- `src/lib/rate-limit.ts` — rate limiter
- `src/lib/validations/` — semua Zod schema

### Multi-Tenancy
- `src/proxy.ts` — subdomain routing
- `prisma/schema.prisma` — model Tenant, TenantUser
- Semua query wajib filter by `tenantId`

### Payment
- `src/lib/services/payment.ts` — Tripay, signature, retry
- Webhook wajib verifikasi HMAC signature

### Upload File
- `src/lib/services/upload.ts` — MIME whitelist, random filename, path traversal prevention

### Notifikasi & Email
- `src/lib/services/` — cek service yang sudah ada
- `prisma/schema.prisma` — model Notification, NotificationSetting

### Frontend / UI
- Layout: `src/app/(auth)/layout.tsx`, `(dashboard)/layout.tsx`, `(super-admin)/layout.tsx`
- Cek `src/components/` sebelum buat komponen baru

### Config & Infrastruktur
- `next.config.ts` — security headers, image domains
- `.env.example` — update jika tambah env var baru
- `docker-compose.yml`, `Dockerfile` jika menyentuh deployment

---

## Aturan Arsitektur

### Edge Runtime
- `src/proxy.ts` = Edge Runtime — dilarang import `crypto`, `fs`, `path`, `bcrypt`, `prisma`
- Gunakan `src/lib/auth.config.ts` (bukan `auth.ts`) di proxy
- Node.js modules hanya boleh di API route atau server component

### Multi-Tenancy
- Query tenant wajib filter by `tenantId` — jangan pernah return data lintas tenant
- Super admin akses data tenant via impersonation, bukan bypass filter

### API Routes
- Wajib pakai `apiHandler()` + `requireAuth()` dari `src/lib/api-utils.ts`
- Wajib validasi body dengan Zod schema
- Rate limiting sudah built-in di `apiHandler`

### Security
- Password: bcrypt salt rounds minimal 10
- File upload: wajib lewat `saveFile()`
- Webhook: wajib verifikasi HMAC
- Jangan log password, token, atau secret

---

## Checklist Sebelum Selesai

- [ ] Tidak ada Node.js module di `src/proxy.ts` atau file yang diimportnya
- [ ] API route baru pakai `apiHandler` + `requireAuth`
- [ ] Query tenant difilter by `tenantId`
- [ ] Env var baru → update `.env.example`
- [ ] Model baru → buat migration
- [ ] Tidak ada `console.log` data sensitif
- [ ] `getDiagnostics` bersih

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Auth | NextAuth v5 (JWT) |
| Database | PostgreSQL + Prisma |
| Styling | Tailwind CSS + Radix UI |
| Validation | Zod |
| Payment | Tripay |
| Email | Nodemailer (SMTP) |
| WhatsApp | StarSender |
| Rate Limit | Upstash Redis (prod) / in-memory (dev) |
| Runtime | Node.js (API) + Edge Runtime (proxy) |
