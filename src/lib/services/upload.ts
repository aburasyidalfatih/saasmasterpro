import fs from "fs"
import path from "path"
import crypto from "crypto"
import { db } from "@/lib/db"

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads"
const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB

// Whitelist of allowed MIME types — extend per project
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
  ],
  video: ["video/mp4", "video/webm"],
  audio: ["audio/mpeg", "audio/wav", "audio/ogg"],
}

const ALL_ALLOWED_MIMES = Object.values(ALLOWED_MIME_TYPES).flat()

// Map allowed MIME types to extensions for safe extension derivation
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "text/csv": ".csv",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "audio/mpeg": ".mp3",
  "audio/wav": ".wav",
  "audio/ogg": ".ogg",
}

/**
 * Sanitize a directory name to prevent path traversal.
 * Only allow alphanumeric, hyphens, underscores.
 */
function sanitizeDirName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "")
}

export function ensureUploadDir(subDir?: string) {
  const safeSub = subDir ? sanitizeDirName(subDir) : ""
  const dir = safeSub ? path.join(UPLOAD_DIR, safeSub) : UPLOAD_DIR
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

/**
 * Validate and save an uploaded file.
 *
 * Security measures:
 * - MIME type whitelist validation
 * - File size limit enforcement
 * - Random filename generation (no user input in path)
 * - Path traversal prevention on subdirectory names
 */
export async function saveFile(
  file: File,
  tenantId?: string,
  subDir?: string,
  allowedCategories?: (keyof typeof ALLOWED_MIME_TYPES)[]
): Promise<{ path: string; name: string; size: number; mimeType: string }> {
  // === Size check ===
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Ukuran file melebihi batas maksimum (${MAX_FILE_SIZE / 1024 / 1024}MB)`)
  }

  // === MIME type check ===
  const allowedMimes = allowedCategories
    ? allowedCategories.flatMap((cat) => ALLOWED_MIME_TYPES[cat] || [])
    : ALL_ALLOWED_MIMES

  if (!allowedMimes.includes(file.type)) {
    throw new Error(
      `Tipe file "${file.type}" tidak diizinkan. Tipe yang diizinkan: ${allowedMimes.join(", ")}`
    )
  }

  // === Derive safe extension from MIME type (NOT from user-provided filename) ===
  const ext = MIME_TO_EXT[file.type] || ""

  // === Generate cryptographically random filename ===
  const randomName = crypto.randomBytes(16).toString("hex")
  const filename = `${Date.now()}-${randomName}${ext}`

  // === Resolve safe directory ===
  const dir = ensureUploadDir(subDir || tenantId || "general")
  const filePath = path.join(dir, filename)

  // === Final safety: ensure resolved path is inside UPLOAD_DIR ===
  const resolvedPath = path.resolve(filePath)
  const resolvedBase = path.resolve(UPLOAD_DIR)
  if (!resolvedPath.startsWith(resolvedBase)) {
    throw new Error("Path traversal detected")
  }

  // === Write file ===
  const buffer = Buffer.from(await file.arrayBuffer())
  fs.writeFileSync(filePath, buffer)

  // === Record in database ===
  await db.fileUpload.create({
    data: {
      tenantId,
      name: file.name,
      path: filePath,
      mimeType: file.type,
      size: file.size,
    },
  })

  return {
    path: filePath,
    name: file.name,
    size: file.size,
    mimeType: file.type,
  }
}

export function deleteFile(filePath: string) {
  // Safety check: only delete files inside UPLOAD_DIR
  const resolvedPath = path.resolve(filePath)
  const resolvedBase = path.resolve(UPLOAD_DIR)
  if (!resolvedPath.startsWith(resolvedBase)) {
    throw new Error("Cannot delete file outside upload directory")
  }

  if (fs.existsSync(resolvedPath)) {
    fs.unlinkSync(resolvedPath)
  }
}

export { ALLOWED_MIME_TYPES }
