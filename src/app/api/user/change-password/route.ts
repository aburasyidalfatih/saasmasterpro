import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { parseBody } from "@/lib/api-utils"

const schema = z.object({
  currentPassword: z.string().min(1, "Password saat ini harus diisi"),
  newPassword: z.string().min(8, "Password baru minimal 8 karakter"),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = await parseBody(req, schema)
  if (parsed.error) return parsed.error

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  })

  if (!user?.password) {
    return NextResponse.json({ error: "Akun ini menggunakan login sosial, tidak bisa ubah password" }, { status: 400 })
  }

  const isValid = await bcrypt.compare(parsed.data.currentPassword, user.password)
  if (!isValid) {
    return NextResponse.json({ error: "Password saat ini salah" }, { status: 400 })
  }

  const hashed = await bcrypt.hash(parsed.data.newPassword, 12)
  await db.user.update({ where: { id: session.user.id }, data: { password: hashed } })

  return NextResponse.json({ message: "Password berhasil diubah" })
}
