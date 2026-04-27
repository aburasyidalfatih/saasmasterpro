---
inclusion: always
---

# SaasMasterPro — Aturan Inti

Stack: Next.js 16, NextAuth v5 (JWT), PostgreSQL + Prisma, Tailwind + Radix UI, Zod, Tripay, Upstash Redis.

**Sebelum mengerjakan perubahan kode, baca file yang relevan terlebih dahulu — jangan berasumsi.**

Aturan kritis:
- `src/proxy.ts` = Edge Runtime — dilarang import Node.js modules (`crypto`, `fs`, `path`, dll). Gunakan `src/lib/auth.config.ts` bukan `src/lib/auth.ts`
- Semua query tenant wajib difilter by `tenantId`
- API route baru wajib pakai `apiHandler` + `requireAuth` dari `src/lib/api-utils.ts`
- File upload wajib lewat `saveFile()` dari `src/lib/services/upload.ts`
- Jalankan `getDiagnostics` setelah selesai

Untuk panduan lengkap (file wajib baca per kategori, checklist, arsitektur): ketik `#project-guide` di chat.
