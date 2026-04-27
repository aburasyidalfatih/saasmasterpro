import { z } from "zod"

// Regex domain yang valid: contoh.com, sub.contoh.co.id
const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/

export const setDomainSchema = z.object({
  tenantId: z.string().min(1, "tenantId harus diisi"),
  domain: z
    .string()
    .min(4, "Domain terlalu pendek")
    .max(253, "Domain terlalu panjang")
    .regex(domainRegex, "Format domain tidak valid. Contoh: mybusiness.com")
    .transform((d) => d.toLowerCase().trim()),
})

export const removeDomainSchema = z.object({
  tenantId: z.string().min(1, "tenantId harus diisi"),
})

export type SetDomainInput = z.infer<typeof setDomainSchema>
export type RemoveDomainInput = z.infer<typeof removeDomainSchema>
