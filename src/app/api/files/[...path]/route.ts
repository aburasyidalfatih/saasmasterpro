/**
 * API Route: Serve uploaded files
 *
 * GET /api/files/logos/filename.png
 * GET /api/files/tenantId/filename.jpg
 *
 * File disimpan di ./uploads/ (di luar public/) untuk keamanan.
 * Route ini serve file dengan validasi path traversal.
 */

import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads"

const MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params

  // Sanitasi setiap segment — tolak path traversal
  // Izinkan: huruf, angka, titik, strip, underscore
  const sanitized = segments.map((s) => s.replace(/[^a-zA-Z0-9._-]/g, ""))
  // Tolak jika ada segment yang berubah setelah sanitasi (ada karakter berbahaya)
  if (sanitized.some((s, i) => s !== segments[i])) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 })
  }
  // Tolak path traversal eksplisit
  if (sanitized.some((s) => s === ".." || s === ".")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 })
  }

  const filePath = path.join(UPLOAD_DIR, ...sanitized)

  // Pastikan path masih di dalam UPLOAD_DIR (double-check traversal)
  const resolvedUploadDir = path.resolve(UPLOAD_DIR)
  const resolvedFilePath = path.resolve(filePath)
  if (!resolvedFilePath.startsWith(resolvedUploadDir)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!fs.existsSync(resolvedFilePath)) {
    return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 })
  }

  const ext = path.extname(resolvedFilePath).toLowerCase()
  const mimeType = MIME_MAP[ext] || "application/octet-stream"
  const fileBuffer = fs.readFileSync(resolvedFilePath)

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
