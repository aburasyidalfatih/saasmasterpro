"use client"

import { useSession, signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import { usePathname } from "next/navigation"
import { Bell, Moon, Sun, LogOut, User, Search, Home, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { TenantSwitcher } from "@/components/shared/tenant-switcher"

const labelMap: Record<string, string> = {
  dashboard: "Dashboard",
  settings: "Pengaturan",
  appearance: "Tampilan & Tema",
  security: "Keamanan",
  users: "Pengguna",
  invite: "Undang Anggota",
  roles: "Peran & Izin",
  billing: "Langganan",
  history: "Riwayat Pembayaran",
  notifications: "Notifikasi",
  preferences: "Preferensi",
  reports: "Laporan",
  trends: "Tren",
  export: "Export Data",
  audit: "Audit Log",
  website: "Kelola Website",
  about: "Profil & Tentang",
  services: "Layanan",
  gallery: "Galeri",
  contact: "Kontak",
  "super-admin": "Super Admin",
  payments: "Pembayaran",
  analytics: "Analitik",
  "my-documents": "Dokumen Saya",
  "my-schedule": "Jadwal",
  "my-messages": "Pesan",
  help: "Panduan",
  faq: "FAQ",
  tenants: "Tenant",
  plans: "Paket & Harga",
  admins: "Super Admin",
  activity: "Aktivitas",
  revenue: "Pendapatan",
  email: "Email & SMTP",
  whatsapp: "WhatsApp",
  payment: "Payment Gateway",
}

function HeaderBreadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  if (segments.length <= 1) {
    // Root page — just show home icon
    return (
      <div className="flex items-center gap-1.5 text-sm">
        <Home className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    )
  }

  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/")
    const label = labelMap[seg] || seg.charAt(0).toUpperCase() + seg.slice(1)
    const isLast = i === segments.length - 1
    return { href, label, isLast }
  })

  return (
    <nav className="flex items-center gap-1 text-sm">
      <Link href={`/${segments[0]}`} className="text-muted-foreground hover:text-foreground transition-colors">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.slice(1).map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
          {crumb.isLast ? (
            <span className="font-semibold text-foreground">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="text-muted-foreground hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}

export function Header() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()

  const isSuperAdminPanel = pathname.startsWith("/super-admin")

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U"

  return (
    <>
      <div className="flex items-center gap-3 min-w-0">
        <HeaderBreadcrumb />
        {!isSuperAdminPanel && <TenantSwitcher />}
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="hidden md:flex relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari..."
            className="w-64 pl-9 h-9 rounded-xl bg-muted/50 border-0 focus-visible:ring-1"
          />
        </div>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-xl h-9 w-9"
        >
          <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle tema</span>
        </Button>

        {/* Notifications */}
        <Link href="/dashboard/notifications">
          <Button variant="ghost" size="icon" className="relative rounded-xl h-9 w-9">
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
            <span className="sr-only">Notifikasi</span>
          </Button>
        </Link>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-accent/50 transition-colors ml-1">
              <Avatar className="h-9 w-9 ring-2 ring-primary/10">
                <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-semibold leading-tight">{session?.user?.name}</span>
                <span className="text-[11px] text-muted-foreground leading-tight">{session?.user?.email}</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 glass rounded-xl" align="end" forceMount>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="flex items-center gap-2 rounded-lg">
                <User className="h-4 w-4" />
                Profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-2 text-destructive rounded-lg"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}
