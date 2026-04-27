import * as OTPAuth from "otpauth"
import QRCode from "qrcode"
import crypto from "crypto"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

const APP_NAME = "SaasMasterPro"

/**
 * Generate a new TOTP secret for a user.
 * Returns the secret (base32) and a QR code data URL.
 */
export async function generateTwoFactorSecret(userId: string, userEmail: string) {
  const totp = new OTPAuth.TOTP({
    issuer: APP_NAME,
    label: userEmail,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  })

  const secret = totp.secret.base32
  const uri = totp.toString()
  const qrCode = await QRCode.toDataURL(uri)

  // Store pending secret (not yet verified)
  await db.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secret },
  })

  return { secret, qrCode, uri }
}

/**
 * Verify a TOTP code against the user's stored secret.
 */
export function verifyTwoFactorCode(secret: string, code: string): boolean {
  const totp = new OTPAuth.TOTP({
    issuer: APP_NAME,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  })

  // Allow 1 period window for clock drift
  const delta = totp.validate({ token: code, window: 1 })
  return delta !== null
}

/**
 * Enable 2FA after user verifies their first code.
 */
export async function enableTwoFactor(userId: string, code: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true },
  })

  if (!user?.twoFactorSecret) {
    throw new Error("2FA secret belum di-generate")
  }

  const isValid = verifyTwoFactorCode(user.twoFactorSecret, code)
  if (!isValid) {
    throw new Error("Kode OTP tidak valid")
  }

  // Generate backup codes using crypto for better entropy
  const backupCodes = Array.from({ length: 8 }, () =>
    crypto.randomBytes(4).toString("hex").toUpperCase()
  )

  // Hash backup codes before storing (plain codes are only shown once to user)
  const hashedCodes = await Promise.all(
    backupCodes.map((code) => bcrypt.hash(code, 10))
  )

  await db.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: true,
      twoFactorBackupCodes: hashedCodes,
    },
  })

  // Return plain codes — this is the only time user sees them
  return { backupCodes }
}

/**
 * Disable 2FA for a user.
 */
export async function disableTwoFactor(userId: string) {
  await db.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: null as any,
    },
  })
}

/**
 * Verify 2FA during login — supports TOTP code or backup code.
 */
export async function verifyTwoFactorLogin(
  userId: string,
  code: string
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true, twoFactorBackupCodes: true },
  })

  if (!user?.twoFactorSecret) return false

  // Try TOTP first
  if (verifyTwoFactorCode(user.twoFactorSecret, code)) {
    return true
  }

  // Try backup code (hashed comparison)
  if (user.twoFactorBackupCodes) {
    const hashedCodes = user.twoFactorBackupCodes as string[]
    const upperCode = code.toUpperCase()

    for (let i = 0; i < hashedCodes.length; i++) {
      const isMatch = await bcrypt.compare(upperCode, hashedCodes[i])
      if (isMatch) {
        // Consume backup code by removing it
        hashedCodes.splice(i, 1)
        await db.user.update({
          where: { id: userId },
          data: { twoFactorBackupCodes: hashedCodes },
        })
        return true
      }
    }
  }

  return false
}
