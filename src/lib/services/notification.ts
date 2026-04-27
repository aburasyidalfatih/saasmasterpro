import { db } from "@/lib/db"
import nodemailer from "nodemailer"

// ==================== EMAIL ====================

// Buat transporter berdasarkan config tenant atau fallback ke platform default
async function getEmailTransporter(tenantId?: string) {
  // Coba ambil config SMTP tenant
  if (tenantId) {
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    })
    const settings = (tenant?.settings as Record<string, any>) || {}
    if (settings.smtp?.smtpHost && settings.smtp?.smtpUser && settings.smtp?.smtpPass) {
      return {
        transporter: nodemailer.createTransport({
          host: settings.smtp.smtpHost,
          port: Number(settings.smtp.smtpPort) || 587,
          secure: Number(settings.smtp.smtpPort) === 465,
          auth: { user: settings.smtp.smtpUser, pass: settings.smtp.smtpPass },
        }),
        from: settings.smtp.smtpFrom || settings.smtp.smtpUser,
        fromName: settings.smtp.smtpFromName || "",
      }
    }
  }
  // Fallback ke platform default
  return {
    transporter: nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    }),
    from: process.env.SMTP_FROM,
    fromName: "SaasMasterPro",
  }
}

export async function sendEmail(to: string, subject: string, html: string, tenantId?: string) {
  const { transporter, from, fromName } = await getEmailTransporter(tenantId)
  return transporter.sendMail({
    from: fromName ? `"${fromName}" <${from}>` : from,
    to,
    subject,
    html,
  })
}

// ==================== WHATSAPP (StarSender) ====================

async function getWaConfig(tenantId?: string) {
  // Coba ambil config WA tenant
  if (tenantId) {
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    })
    const settings = (tenant?.settings as Record<string, any>) || {}
    if (settings.whatsapp?.waApiKey) {
      return {
        apiUrl: settings.whatsapp.waApiUrl || "https://api.starsender.online/api",
        apiKey: settings.whatsapp.waApiKey,
      }
    }
  }
  // Fallback ke platform default
  return {
    apiUrl: process.env.STARSENDER_API_URL || "https://api.starsender.online/api",
    apiKey: process.env.STARSENDER_API_KEY || "",
  }
}

export async function sendWhatsApp(phone: string, message: string, tenantId?: string) {
  const { apiUrl, apiKey } = await getWaConfig(tenantId)
  const response = await fetch(`${apiUrl}/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ messageType: "text", to: phone, body: message }),
  })
  return response.json()
}

// ==================== IN-APP NOTIFICATION ====================

export async function createInAppNotification(params: {
  tenantId?: string
  userId: string
  title: string
  message: string
  type?: string
}) {
  return db.notification.create({
    data: {
      tenantId: params.tenantId,
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type || "info",
      channel: "inapp",
    },
  })
}

// ==================== UNIFIED SEND ====================

export async function sendNotification(params: {
  tenantId?: string
  userId: string
  title: string
  message: string
  type?: string
  channels?: ("inapp" | "email" | "whatsapp")[]
}) {
  const channels = params.channels || ["inapp"]

  // Cek preferensi user
  const settings = await db.notificationSetting.findMany({
    where: { userId: params.userId },
  })

  const user = await db.user.findUnique({
    where: { id: params.userId },
  })

  for (const channel of channels) {
    const setting = settings.find((s) => s.channel === channel)
    if (setting && !setting.enabled) continue

    switch (channel) {
      case "inapp":
        await createInAppNotification(params)
        break
      case "email":
        if (user?.email) {
          await sendEmail(user.email, params.title, `<p>${params.message}</p>`, params.tenantId)
        }
        break
      case "whatsapp":
        if (user?.phone) {
          await sendWhatsApp(user.phone, `${params.title}\n\n${params.message}`, params.tenantId)
        }
        break
    }
  }
}
