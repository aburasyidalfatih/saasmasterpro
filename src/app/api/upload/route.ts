import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { saveFile } from "@/lib/services/upload"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const tenantId = formData.get("tenantId") as string | null
    const subDir = formData.get("subDir") as string | null

    if (!file) {
      return NextResponse.json({ error: "File harus diupload" }, { status: 400 })
    }

    const allowedTypes = [
      "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/csv",
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipe file tidak diizinkan: ${file.type}` },
        { status: 400 }
      )
    }

    const result = await saveFile(file, tenantId || undefined, subDir || undefined)

    // Konversi path absolut filesystem ke URL publik via /api/files/...
    // result.path bisa berupa path absolut (Windows/Linux) atau relative
    // Kita ambil bagian setelah UPLOAD_DIR, lalu jadikan URL
    const nodePath = require("path")
    const uploadDirResolved = nodePath.resolve(process.env.UPLOAD_DIR || "./uploads")
    const fileResolved = nodePath.resolve(result.path)
    // Ambil relative path dari UPLOAD_DIR, normalize separator ke forward slash
    const relativeToUpload = fileResolved
      .replace(uploadDirResolved, "")
      .replace(/\\/g, "/")
      .replace(/^\//, "")
    const publicUrl = `/api/files/${relativeToUpload}`

    return NextResponse.json({
      message: "File berhasil diupload",
      url: publicUrl,
      file: {
        name: result.name,
        size: result.size,
        mimeType: result.mimeType,
        path: result.path,
        url: publicUrl,
      },
    })
  } catch (error: any) {
    if (error.message?.includes("batas maksimum")) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload gagal" }, { status: 500 })
  }
}
