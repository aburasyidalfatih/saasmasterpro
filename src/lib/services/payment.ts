import crypto from "crypto"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

const MAX_RETRY = 3
const RETRY_DELAY_MS = [1000, 5000, 15000]

// Ambil config Tripay: cek tenant dulu, fallback ke platform default
async function getTripayConfig(tenantId: string) {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  })
  const settings = (tenant?.settings as Record<string, any>) || {}
  if (settings.tripay?.tripayApiKey && settings.tripay?.tripayMerchantCode) {
    return {
      apiUrl: settings.tripay.tripayApiUrl || "https://tripay.co.id/api-sandbox",
      apiKey: settings.tripay.tripayApiKey,
      privateKey: settings.tripay.tripayPrivateKey || "",
      merchantCode: settings.tripay.tripayMerchantCode,
    }
  }
  // Fallback ke platform default
  return {
    apiUrl: process.env.TRIPAY_API_URL || "https://tripay.co.id/api-sandbox",
    apiKey: process.env.TRIPAY_API_KEY || "",
    privateKey: process.env.TRIPAY_PRIVATE_KEY || "",
    merchantCode: process.env.TRIPAY_MERCHANT_CODE || "",
  }
}

interface CreateTransactionParams {
  tenantId: string
  plan: string
  amount: number
  method: string
  customerName: string
  customerEmail: string
  customerPhone?: string
}

export async function getPaymentChannels(tenantId?: string) {
  const cfg = tenantId
    ? await getTripayConfig(tenantId)
    : {
        apiUrl: process.env.TRIPAY_API_URL || "https://tripay.co.id/api-sandbox",
        apiKey: process.env.TRIPAY_API_KEY || "",
        privateKey: process.env.TRIPAY_PRIVATE_KEY || "",
        merchantCode: process.env.TRIPAY_MERCHANT_CODE || "",
      }
  const response = await fetch(`${cfg.apiUrl}/merchant/payment-channel`, {
    headers: { Authorization: `Bearer ${cfg.apiKey}` },
  })
  const data = await response.json()
  return data.data || []
}

export async function createTransaction(params: CreateTransactionParams) {
  const cfg = await getTripayConfig(params.tenantId)
  const merchantRef = `INV-${Date.now()}`

  const signature = crypto
    .createHmac("sha256", cfg.privateKey)
    .update(cfg.merchantCode + merchantRef + params.amount)
    .digest("hex")

  const payload = {
    method: params.method,
    merchant_ref: merchantRef,
    amount: params.amount,
    customer_name: params.customerName,
    customer_email: params.customerEmail,
    customer_phone: params.customerPhone || "",
    order_items: [
      {
        name: `Paket ${params.plan}`,
        price: params.amount,
        quantity: 1,
      },
    ],
    signature,
  }

  const response = await fetch(`${cfg.apiUrl}/transaction/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify(payload),
  })

  const result = await response.json()

  if (result.success) {
    await db.payment.create({
      data: {
        tenantId: params.tenantId,
        reference: merchantRef,
        amount: params.amount,
        method: params.method,
        plan: params.plan,
        tripayRef: result.data.reference,
        expiredAt: new Date(result.data.expired_time * 1000),
      },
    })
  }

  return result
}

interface TripayCallbackBody {
  merchant_ref: string
  status: string
  signature: string
  reference?: string
  total_amount?: number
  fee_merchant?: number
  fee_customer?: number
  payment_method?: string
  payment_method_code?: string
  paid_at?: string
}

/**
 * Verify Tripay callback signature to ensure authenticity.
 * Tripay signs callbacks with HMAC SHA256 using the private key.
 */
export function verifyCallbackSignature(
  body: TripayCallbackBody,
  privateKey: string
): boolean {
  const signature = crypto
    .createHmac("sha256", privateKey)
    .update(JSON.stringify(body))
    .digest("hex")
  return signature === body.signature
}

export async function handleCallback(body: TripayCallbackBody) {
  // Step 1: Find the payment by merchant reference
  const payment = await db.payment.findUnique({
    where: { reference: body.merchant_ref },
  })

  if (!payment) return null

  // Step 2: Verify callback signature
  const cfg = await getTripayConfig(payment.tenantId)
  if (!verifyCallbackSignature(body, cfg.privateKey)) {
    logger.warn("[payment] Invalid callback signature", {
      merchantRef: body.merchant_ref,
    })
    throw new Error("Invalid callback signature")
  }

  // Step 3: Update payment status
  const updatedPayment = await db.payment.update({
    where: { id: payment.id },
    data: {
      status: body.status === "PAID" ? "paid" : body.status.toLowerCase(),
      paidAt: body.status === "PAID" ? new Date() : null,
    },
  })

  // Step 4: Upgrade tenant plan jika pembayaran berhasil
  if (body.status === "PAID") {
    await retryAsync(
      () => db.tenant.update({
        where: { id: payment.tenantId },
        data: { plan: payment.plan },
      }),
      "upgrade-plan"
    )
  }

  return updatedPayment
}

/**
 * Retry an async operation with exponential backoff.
 * Used for critical post-payment operations that must not be lost.
 */
async function retryAsync<T>(
  fn: () => Promise<T>,
  label: string,
  maxRetries = MAX_RETRY
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxRetries) {
        logger.error(`[payment] ${label} failed after ${maxRetries + 1} attempts`, error)
        throw error
      }
      const delay = RETRY_DELAY_MS[attempt] || 15000
      logger.warn(`[payment] ${label} attempt ${attempt + 1} failed, retrying in ${delay}ms`, {
        error: error instanceof Error ? error.message : String(error),
      })
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw new Error("Unreachable")
}
