"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Settings,
  CreditCard,
  Bell,
  FileText,
  BarChart3,
  Shield,
  ChevronLeft,
  ChevronDown,
  UserPlus,
  UserCog,
  ShieldCheck,
  Receipt,
  Wallet,
  BellRing,
  BellOff,
  PieChart,
  TrendingUp,
  ClipboardList,
  Building2,
  Palette,
  Lock,
  Globe,
  Server,
  Activity,
  Database,
  Mail,
  Megaphone,
  Tag,
  HelpCircle,
  BookOpen,
  MessageSquare,
  Calendar,
  FolderOpen,
  User,
  LayoutTemplate,
  Home,
  Image,
  Briefcase,
  Phone,
  Info,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useSession } from "next-auth/react"

// ============================================================
// MENU DEFINITIONS
// ============================================================

interface MenuItem {
  label: string
  href: string
  icon: LucideIcon
  children?: { label: string; href: string; icon: LucideIcon }[]
}

interface MenuSection {
  title?: string
  items: MenuItem[]
}

// --- TENANT ADMIN MENU ---
function getTenantMenu(basePath: string): MenuSection[] {
  return [
    {
      items: [
        { label: "Dashboard", href: basePath, icon: LayoutDashboard },
      ],
    },
    {
      title: "Website",
      items: [
        {
          label: "Kelola Website",
          href: `${basePath}/website`,
          icon: LayoutTemplate,
          children: [
            { label: "Beranda", href: `${basePath}/website`, icon: Home },
            { label: "Profil & Tentang", href: `${basePath}/website/about`, icon: Info },
            { label: "Layanan", href: `${basePath}/website/services`, icon: Briefcase },
            { label: "Galeri", href: `${basePath}/website/gallery`, icon: Image },
            { label: "Kontak", href: `${basePath}/website/contact`, icon: Phone },
          ],
        },
      ],
    },
    {
      title: "Manajemen",
      items: [
        {
          label: "Pengguna",
          href: `${basePath}/users`,
          icon: Users,
          children: [
            { label: "Daftar Pengguna", href: `${basePath}/users`, icon: UserCog },
            { label: "Undang Anggota", href: `${basePath}/users/invite`, icon: UserPlus },
            { label: "Peran & Izin", href: `${basePath}/users/roles`, icon: ShieldCheck },
          ],
        },
        {
          label: "Keuangan",
          href: `${basePath}/billing`,
          icon: CreditCard,
          children: [
            { label: "Langganan", href: `${basePath}/billing`, icon: Wallet },
            { label: "Riwayat Pembayaran", href: `${basePath}/billing/history`, icon: Receipt },
          ],
        },
      ],
    },
    {
      title: "Komunikasi",
      items: [
        {
          label: "Notifikasi",
          href: `${basePath}/notifications`,
          icon: Bell,
          children: [
            { label: "Semua Notifikasi", href: `${basePath}/notifications`, icon: BellRing },
            { label: "Preferensi", href: `${basePath}/notifications/preferences`, icon: BellOff },
          ],
        },
      ],
    },
    {
      title: "Analitik",
      items: [
        {
          label: "Laporan",
          href: `${basePath}/reports`,
          icon: BarChart3,
          children: [
            { label: "Analitik", href: `${basePath}/reports`, icon: PieChart },
            { label: "Tren", href: `${basePath}/reports/trends`, icon: TrendingUp },
            { label: "Export Data", href: `${basePath}/reports/export`, icon: ClipboardList },
          ],
        },
        { label: "Audit Log", href: `${basePath}/audit`, icon: FileText },
      ],
    },
    {
      title: "Konfigurasi",
      items: [
        {
          label: "Pengaturan",
          href: `${basePath}/settings`,
          icon: Settings,
          children: [
            { label: "Umum", href: `${basePath}/settings`, icon: Building2 },
            { label: "Tampilan & Tema", href: `${basePath}/settings/appearance`, icon: Palette },
            { label: "Email (SMTP)", href: `${basePath}/settings/email`, icon: Mail },
            { label: "WhatsApp Gateway", href: `${basePath}/settings/whatsapp`, icon: Megaphone },
            { label: "Payment Gateway", href: `${basePath}/settings/payment`, icon: CreditCard },
            { label: "Keamanan", href: `${basePath}/settings/security`, icon: Lock },
          ],
        },
      ],
    },
  ]
}

// --- MEMBER (USER BIASA) MENU ---
function getMemberMenu(basePath: string): MenuSection[] {
  return [
    {
      items: [
        { label: "Dashboard", href: basePath, icon: LayoutDashboard },
      ],
    },
    {
      title: "Aktivitas",
      items: [
        { label: "Dokumen Saya", href: `${basePath}/my-documents`, icon: FolderOpen },
        { label: "Jadwal", href: `${basePath}/my-schedule`, icon: Calendar },
        { label: "Pesan", href: `${basePath}/my-messages`, icon: MessageSquare },
      ],
    },
    {
      title: "Informasi",
      items: [
        { label: "Notifikasi", href: `${basePath}/notifications`, icon: Bell },
        { label: "Panduan", href: `${basePath}/help`, icon: BookOpen },
        { label: "FAQ", href: `${basePath}/faq`, icon: HelpCircle },
      ],
    },
    {
      title: "Akun",
      items: [
        {
          label: "Pengaturan",
          href: `${basePath}/settings`,
          icon: Settings,
          children: [
            { label: "Profil Saya", href: `${basePath}/settings`, icon: User },
            { label: "Keamanan", href: `${basePath}/settings/security`, icon: Lock },
          ],
        },
      ],
    },
  ]
}

// --- SUPER ADMIN MENU ---
function getSuperAdminMenu(): MenuSection[] {
  return [
    {
      items: [
        { label: "Dashboard", href: "/super-admin", icon: LayoutDashboard },
      ],
    },
    {
      title: "Platform",
      items: [
        {
          label: "Tenant",
          href: "/super-admin/tenants",
          icon: Building2,
          children: [
            { label: "Semua Tenant", href: "/super-admin/tenants", icon: Globe },
            { label: "Paket & Harga", href: "/super-admin/tenants/plans", icon: Tag },
          ],
        },
        {
          label: "Pengguna",
          href: "/super-admin/users",
          icon: Users,
          children: [
            { label: "Semua Pengguna", href: "/super-admin/users", icon: UserCog },
            { label: "Super Admin", href: "/super-admin/users/admins", icon: ShieldCheck },
          ],
        },
      ],
    },
    {
      title: "Keuangan",
      items: [
        {
          label: "Pembayaran",
          href: "/super-admin/payments",
          icon: CreditCard,
          children: [
            { label: "Semua Transaksi", href: "/super-admin/payments", icon: Receipt },
            { label: "Pendapatan", href: "/super-admin/payments/revenue", icon: Wallet },
          ],
        },
      ],
    },
    {
      title: "Monitoring",
      items: [
        { label: "Analitik Platform", href: "/super-admin/analytics", icon: BarChart3 },
        { label: "Aktivitas Sistem", href: "/super-admin/activity", icon: Activity },
        { label: "Audit Log Global", href: "/super-admin/audit", icon: FileText },
      ],
    },
    {
      title: "Sistem",
      items: [
        {
          label: "Pengaturan",
          href: "/super-admin/settings",
          icon: Settings,
          children: [
            { label: "Umum", href: "/super-admin/settings", icon: Server },
            { label: "Email & SMTP", href: "/super-admin/settings/email", icon: Mail },
            { label: "WhatsApp", href: "/super-admin/settings/whatsapp", icon: Megaphone },
            { label: "Payment Gateway", href: "/super-admin/settings/payment", icon: CreditCard },
          ],
        },
      ],
    },
  ]
}

// ============================================================
// SIDEBAR COMPONENT
// ============================================================

interface SidebarProps {
  isSuperAdmin?: boolean
}

export function Sidebar({ isSuperAdmin }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [collapsed, setCollapsed] = useState(false)
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})

  const basePath = "/dashboard"

  // Detect role dari session
  const isSuperAdminPath = pathname.startsWith("/super-admin")
  const currentTenantSlug = session?.user?.tenants?.[0]?.slug
  const currentTenant = session?.user?.tenants?.find((t) => t.slug === currentTenantSlug) || session?.user?.tenants?.[0]
  const currentRole = currentTenant?.role || "member"

  // Nama & inisial branding: nama tenant untuk dashboard, SaasMasterPro untuk super-admin
  const brandName = isSuperAdminPath ? "SaasMasterPro" : (currentTenant?.name || "SaasMasterPro")
  const brandInitial = brandName.charAt(0).toUpperCase()

  // Saat impersonate, super admin dianggap admin tenant
  const isImpersonating = typeof document !== "undefined" && document.cookie.includes("impersonate-tenant=")
  const isImpersonatingUser = typeof document !== "undefined" && document.cookie.includes("impersonate-user=")
  const isAdminRole = !isImpersonatingUser && (currentRole === "owner" || currentRole === "admin" || (session?.user?.isSuperAdmin && isImpersonating))

  // Pilih menu berdasarkan role
  let sections: MenuSection[]
  if (isSuperAdminPath) {
    sections = getSuperAdminMenu()
  } else if (isAdminRole) {
    sections = getTenantMenu(basePath)
  } else {
    sections = getMemberMenu(basePath)
  }
  const homeHref = isSuperAdminPath ? "/super-admin" : basePath

  // Auto-open parent menu if child is active
  const getInitialOpen = () => {
    const open: Record<string, boolean> = {}
    sections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children) {
          const isChildActive = item.children.some(
            (child) => pathname === child.href || pathname.startsWith(child.href + "/")
          )
          if (isChildActive) open[item.label] = true
        }
      })
    })
    return open
  }

  const effectiveOpen = { ...getInitialOpen(), ...openMenus }

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !effectiveOpen[label] }))
  }

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col glass border-r transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo + Collapse */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border/50">
        {!collapsed ? (
          <>
            <Link href={homeHref} className="flex items-center gap-2.5">
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl text-white font-bold text-sm shadow-lg",
                isSuperAdminPath ? "bg-gradient-to-br from-red-500 to-orange-500" : "btn-gradient"
              )}>
                {isSuperAdminPath ? "⚡" : brandInitial}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm tracking-tight leading-tight truncate max-w-[140px]">{brandName}</span>
                <span className={cn(
                  "text-[10px] font-medium leading-tight",
                  isSuperAdminPath ? "text-red-500" : "text-muted-foreground"
                )}>
                  {isSuperAdminPath ? "Super Admin" : isAdminRole ? "Admin Panel" : "User Panel"}
                </span>
              </div>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setCollapsed(true)} className="h-8 w-8 rounded-lg shrink-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <button
            onClick={() => setCollapsed(false)}
            className={cn(
              "flex h-9 w-9 mx-auto items-center justify-center rounded-xl text-white font-bold text-sm shadow-lg hover:opacity-90 transition-opacity",
              isSuperAdminPath ? "bg-gradient-to-br from-red-500 to-orange-500" : "btn-gradient"
            )}
          >
            {isSuperAdminPath ? "⚡" : brandInitial}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {sections.map((section, si) => (
          <div key={si} className={si > 0 ? "mt-4" : ""}>
            {/* Section title */}
            {section.title && !collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {section.title}
              </p>
            )}
            {section.title && collapsed && <div className="mx-auto my-2 h-px w-6 bg-border/50" />}

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isExactActive = pathname === item.href
                const isChildActive = item.children?.some(
                  (child) => pathname === child.href || pathname.startsWith(child.href + "/")
                )
                const isActive = isExactActive || (!item.children && pathname.startsWith(item.href + "/"))
                const isOpen = effectiveOpen[item.label] && !collapsed
                const hasChildren = item.children && item.children.length > 0

                return (
                  <div key={item.label}>
                    {hasChildren ? (
                      <button
                        onClick={() => { if (!collapsed) toggleMenu(item.label) }}
                        className={cn(
                          "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                          isActive || isChildActive
                            ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary shadow-sm"
                            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                        )}
                      >
                        <div className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
                          isActive || isChildActive ? "bg-primary/10 text-primary" : "text-muted-foreground group-hover:bg-accent group-hover:text-foreground"
                        )}>
                          <item.icon className="h-[18px] w-[18px]" />
                        </div>
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-left">{item.label}</span>
                            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
                          </>
                        )}
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        transitionTypes={["slide-forward"]}
                        className={cn(
                          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary shadow-sm"
                            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                        )}
                      >
                        <div className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
                          isActive ? "bg-primary/10 text-primary" : "text-muted-foreground group-hover:bg-accent group-hover:text-foreground"
                        )}>
                          <item.icon className="h-[18px] w-[18px]" />
                        </div>
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    )}

                    {/* Sub-menu */}
                    {hasChildren && !collapsed && (
                      <div className={cn("overflow-hidden transition-all duration-200 ease-in-out", isOpen ? "max-h-96 opacity-100 mt-0.5" : "max-h-0 opacity-0")}>
                        <div className="ml-[22px] border-l border-border/50 pl-4 space-y-0.5 py-0.5">
                          {item.children!.map((child) => {
                            const isSubActive = pathname === child.href || pathname.startsWith(child.href + "/")
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                transitionTypes={["slide-forward"]}
                                className={cn(
                                  "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-200",
                                  isSubActive ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                                )}
                              >
                                <child.icon className={cn("h-4 w-4 shrink-0", isSubActive ? "text-primary" : "text-muted-foreground/70")} />
                                <span>{child.label}</span>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom card */}
      {!collapsed && !isSuperAdminPath && (
        <div className="p-3">
          <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-4">
            <p className="text-xs font-medium text-foreground">Paket Gratis</p>
            <p className="text-xs text-muted-foreground mt-1">Upgrade untuk fitur lengkap</p>
            <Link href={`${basePath}/billing`}>
              <Button size="sm" className="mt-3 w-full rounded-lg btn-gradient text-white text-xs h-8 border-0">
                Upgrade
              </Button>
            </Link>
          </div>
        </div>
      )}
    </aside>
  )
}
