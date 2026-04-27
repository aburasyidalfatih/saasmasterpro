import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import {
  ArrowRight,
  Calendar,
  Megaphone,
  Newspaper,
  Trophy,
  CheckCircle,
  MessageCircle,
  MapPin,
  Phone,
  Mail,
  Users,
  BookOpen,
  Award,
  Clock,
} from "lucide-react"
import { HeroSlider } from "./components/hero-slider"
import { StatsBar } from "./components/stats-bar"
import { SectionHeader } from "./components/section-header"

export default async function SitePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const tenant = await db.tenant.findUnique({
    where: { slug },
    select: {
      name: true,
      slug: true,
      tagline: true,
      description: true,
      about: true,
      services: true,
      heroImage: true,
      gallery: true,
      phone: true,
      whatsapp: true,
      address: true,
      email: true,
    },
  })

  if (!tenant) notFound()

  const services = (tenant.services as string[]) || []
  const gallery = (tenant.gallery as string[]) || []

  const base = `/site/${slug}`

  return (
    <main>
      {/* ── Section 1: Hero Slider ── */}
      <HeroSlider
        base={base}
        slides={[
          {
            subtitle: tenant.name,
            title: tenant.tagline
              ? tenant.tagline.replace(/\\n/g, "\n")
              : `Selamat Datang di\n${tenant.name}`,
            description:
              tenant.description ??
              "Membentuk generasi Islami yang berilmu, berakhlak mulia, dan berdaya saing global.",
            cta: { href: "/contact", label: "Daftar Sekarang" },
            ctaSecondary: { href: "/about", label: "Profil Sekolah" },
          },
        ]}
      />

      {/* ── Section 2: Stats Bar ── */}
      <StatsBar
        stats={[
          { value: "850+", label: "Santri Aktif", icon: "users" },
          { value: "65", label: "Guru & Staf", icon: "book" },
          { value: "120+", label: "Prestasi", icon: "award" },
          { value: "18", label: "Tahun Pengalaman", icon: "clock" },
        ]}
      />

      {/* ── Section 3: Sambutan Pimpinan ── */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Col 1 – Portrait */}
            <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: "3/4", background: "linear-gradient(135deg, hsl(var(--primary)/0.1), hsl(var(--primary)/0.05))" }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-8xl">👤</span>
              </div>
              <div
                className="absolute bottom-0 left-0 right-0 px-4 py-3"
                style={{ background: "hsl(var(--primary))" }}
              >
                <p className="text-white font-bold text-sm">Ustadz Ahmad Fauzi, S.Pd.I</p>
                <p className="text-white/75 text-xs">Pimpinan Pesantren</p>
              </div>
            </div>

            {/* Col 2 – Text */}
            <div className="flex flex-col justify-center">
              <p
                className="text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: "hsl(var(--primary))" }}
              >
                SAMBUTAN PIMPINAN PESANTREN
              </p>
              <h2 className="text-3xl font-extrabold mb-4 leading-tight">
                Welcome to{" "}
                <span style={{ color: "hsl(var(--primary))" }}>{tenant.name}</span>
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                {tenant.about ??
                  "Kami berkomitmen untuk memberikan pendidikan Islam terbaik yang memadukan ilmu agama dan ilmu umum, membentuk generasi yang berakhlak mulia, cerdas, dan siap menghadapi tantangan zaman."}
              </p>
              <div className="flex flex-wrap gap-2 mb-5">
                {[
                  { icon: "📚", label: "Pendidikan Islam" },
                  { icon: "🤝", label: "Berkarakter" },
                  { icon: "📖", label: "Kurikulum & Arti" },
                  { icon: "🌟", label: "Pengembangan Potensi" },
                ].map((tag) => (
                  <span
                    key={tag.label}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{ background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))" }}
                  >
                    {tag.icon} {tag.label}
                  </span>
                ))}
              </div>
              <Link
                href={`${base}/about`}
                className="text-sm font-semibold hover:underline"
                style={{ color: "hsl(var(--primary))" }}
              >
                Selengkapnya tentang kami →
              </Link>
            </div>

            {/* Col 3 – Quote card */}
            <div
              className="relative rounded-2xl p-6 overflow-hidden"
              style={{
                border: "2px solid hsl(var(--primary)/0.2)",
                background: "hsl(var(--primary)/0.05)",
              }}
            >
              <p
                className="text-6xl font-serif leading-none mb-2"
                style={{ color: "hsl(var(--primary)/0.2)" }}
              >
                &ldquo;
              </p>
              <p className="italic text-sm leading-relaxed text-foreground/80 mb-4">
                Ilmu tanpa agama adalah buta, agama tanpa ilmu adalah lumpuh.
              </p>
              <div
                className="border-t mb-4"
                style={{ borderColor: "hsl(var(--primary)/0.2)" }}
              />
              <p className="font-bold text-sm">Ustadz Ahmad Fauzi, S.Pd.I</p>
              <p className="text-xs text-muted-foreground">Pimpinan Pesantren</p>
              {/* Decorative mosque */}
              <span
                className="absolute right-2 bottom-0 text-[6rem] leading-none select-none pointer-events-none"
                style={{ opacity: 0.1 }}
              >
                🕌
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4: 3-Column Content ── */}
      <section className="bg-gray-50 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-5">

            {/* Card 1 – Agenda */}
            <div className="bg-white rounded-2xl border shadow-sm p-5">
              <SectionHeader
                title="Agenda Kegiatan"
                icon={<Calendar className="h-4 w-4" />}
                viewAllHref={`${base}/agenda`}
                viewAllLabel="Lihat Semua"
              />
              <div className="space-y-3">
                {[
                  { day: "20", month: "MEI", title: "Seminar Parenting Islami", time: "08:00 - 12:00 WIB · Aula Utama" },
                  { day: "25", month: "MEI", title: "Tes Tahfidz Al-Qur'an Juz 30", time: "09:00 - 11:00 WIB · Masjid Sekolah" },
                  { day: "02", month: "JUN", title: "Ujian Kenaikan Kelas 2024/2025", time: "07:00 - 12:00 WIB · Ruang Kelas" },
                  { day: "15", month: "JUN", title: "Pembagian Rapor Genap", time: "08:00 - 10:00 WIB · Aula Utama" },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-lg flex flex-col items-center justify-center text-white"
                      style={{ background: "hsl(var(--primary))" }}
                    >
                      <span className="text-xs font-extrabold leading-none">{item.day}</span>
                      <span className="text-[9px] font-semibold leading-none opacity-80">{item.month}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-snug">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2 – Pengumuman */}
            <div className="bg-white rounded-2xl border shadow-sm p-5">
              <SectionHeader
                title="Pengumuman Terbaru"
                icon={<Megaphone className="h-4 w-4" />}
                viewAllHref={`${base}/pengumuman`}
                viewAllLabel="Lihat Semua"
              />
              <div className="space-y-3">
                {[
                  {
                    day: "15", month: "MEI",
                    badgeLabel: "PENDAFTARAN", badgeBg: "bg-blue-100", badgeText: "text-blue-700",
                    title: "Pendaftaran PPDB 2024/2025 Resmi Dibuka",
                    desc: "Dapatkan Potongan Biaya Pendaftaran untuk Gelombang 1",
                  },
                  {
                    day: "12", month: "MEI",
                    badgeLabel: "AKADEMIK", badgeBg: "bg-green-100", badgeText: "text-green-700",
                    title: "Pengumuman Hasil Evaluasi Akhir",
                    desc: "Hasil evaluasi pembelajaran semester genap Tahun Ajaran 2023...",
                  },
                  {
                    day: "10", month: "MEI",
                    badgeLabel: "KEGIATAN", badgeBg: "bg-orange-100", badgeText: "text-orange-700",
                    title: "Kegiatan Bin'Mhj Al-Ustadz",
                    desc: "Kegiatan peningkatan bin'Mhj bersama Al-Ustadz",
                  },
                  {
                    day: "06", month: "MEI",
                    badgeLabel: "INFO", badgeBg: "bg-purple-100", badgeText: "text-purple-700",
                    title: "Rapat Munaqosah & Tasm' Al-Qur'an",
                    desc: "Santri kelas 6 mengikuti munaqosah dan tasm' Al-Qur'an",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-lg flex flex-col items-center justify-center"
                      style={{ background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))" }}
                    >
                      <span className="text-xs font-extrabold leading-none">{item.day}</span>
                      <span className="text-[9px] font-semibold leading-none opacity-70">{item.month}</span>
                    </div>
                    <div className="min-w-0">
                      <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded mb-1 ${item.badgeBg} ${item.badgeText}`}>
                        {item.badgeLabel}
                      </span>
                      <p className="text-sm font-semibold leading-snug line-clamp-1">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 3 – Artikel & Berita */}
            <div className="bg-white rounded-2xl border shadow-sm p-5">
              <SectionHeader
                title="Artikel & Berita"
                icon={<Newspaper className="h-4 w-4" />}
                viewAllHref={`${base}/berita`}
                viewAllLabel="Lihat Semua"
              />
              <div className="space-y-3">
                {[
                  { emoji: "📰", category: "Berita", date: "15 Mei 2024", title: "Perkembangan Santri Baru Gelombang 1 Telah Dibuka" },
                  { emoji: "🏛️", category: "Kegiatan", date: "12 Mei 2024", title: "Kunjungan Edukatif ke Museum Sejarah Islam" },
                  { emoji: "💻", category: "Edukasi", date: "10 Mei 2024", title: "Workshop Teknologi Pembelajaran untuk Guru" },
                  { emoji: "🏆", category: "Prestasi", date: "08 Mei 2024", title: "Santri Raih Juara Olimpiade Tingkat Provinsi" },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                      style={{ background: "hsl(var(--primary)/0.08)" }}
                    >
                      {item.emoji}
                    </div>
                    <div className="min-w-0">
                      <p
                        className="text-[10px] font-bold uppercase tracking-wide"
                        style={{ color: "hsl(var(--primary))" }}
                      >
                        {item.category}
                      </p>
                      <p className="text-sm font-semibold leading-snug line-clamp-2">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Section 5: Prestasi Santri ── */}
      <section style={{ background: "hsl(var(--primary))" }} className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header row */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-white" />
              <h2 className="text-lg font-bold text-white">Prestasi Santri</h2>
            </div>
            <Link
              href={`${base}/prestasi`}
              className="text-xs font-medium hover:underline"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              Lihat Semua Prestasi →
            </Link>
          </div>

          {/* 6-column grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-white/15">
            {[
              { emoji: "🥇", rank: "Juara 1", event: "Olimpiade Matematika", level: "Tingkat Provinsi" },
              { emoji: "🥈", rank: "Juara 2", event: "Musabaqoh Hifdzil Qur'an", level: "Tingkat Nasional" },
              { emoji: "🏅", rank: "Medali Emas", event: "Kompetisi Sains", level: "Tingkat Nasional" },
              { emoji: "🏆", rank: "Juara Harapan 1", event: "Lomba Dai Muda", level: "Tingkat Kota" },
              { emoji: "🥉", rank: "Juara 3", event: "Olimpiade Bahasa Inggris", level: "Tingkat Provinsi" },
              { emoji: "⭐", rank: "Juara 1", event: "Lomba Karya Tulis", level: "Tingkat Kota" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center px-3 py-2">
                <span className="text-4xl mb-2">{item.emoji}</span>
                <p className="text-sm font-bold text-white leading-tight">{item.rank}</p>
                <p className="text-xs mt-0.5 leading-snug" style={{ color: "rgba(255,255,255,0.7)" }}>{item.event}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{item.level}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 6: Guru Teladan ── */}
      <section className="bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Guru Teladan Kami</h2>
            <Link
              href={`${base}/guru`}
              className="text-xs font-medium hover:underline"
              style={{ color: "hsl(var(--primary))" }}
            >
              Lihat Semua Guru →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { emoji: "👨‍💼", name: "Ustadz Abdul Karim, M.Pd", role: "Kepala Sekolah" },
              { emoji: "👩‍💼", name: "Ustadzah Siti Aisyah, S.Pd", role: "Wali Kelas" },
              { emoji: "👨‍💻", name: "Ustadz Fahmi Hidayat, S.Pd", role: "Guru Matematika" },
              { emoji: "👩‍🏫", name: "Ustadzah Nadia Rohma, M.Ag", role: "Guru Tahfidz" },
            ].map((person) => (
              <div key={person.name} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <div
                  className="flex items-center justify-center"
                  style={{ aspectRatio: "3/4", background: "hsl(var(--primary)/0.08)" }}
                >
                  <span className="text-6xl">{person.emoji}</span>
                </div>
                <div className="p-3 text-center">
                  <p className="font-bold text-sm leading-snug">{person.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{person.role}</p>
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    {["📘", "📷", "🐦"].map((icon) => (
                      <button
                        key={icon}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-xs"
                        style={{ background: "hsl(var(--primary)/0.08)" }}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 7: Fasilitas + Kegiatan ── */}
      <section className="bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">

            {/* Left – Fasilitas */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Fasilitas Islami</h2>
                <Link
                  href={`${base}/fasilitas`}
                  className="text-xs font-medium hover:underline"
                  style={{ color: "hsl(var(--primary))" }}
                >
                  Lihat Semua Fasilitas →
                </Link>
              </div>

              {gallery.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {gallery.slice(0, 5).map((url, i) => (
                    <div
                      key={i}
                      className={`rounded-xl overflow-hidden ${i === 0 ? "col-span-2 row-span-2" : ""}`}
                      style={{ aspectRatio: i === 0 ? "auto" : "1/1" }}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2" style={{ gridTemplateRows: "auto auto" }}>
                  {[
                    { emoji: "🏛️", label: "Masjid 3 Lantai", large: true },
                    { emoji: "📚", label: "Perpustakaan", large: false },
                    { emoji: "🔬", label: "Lab. Sains", large: false },
                    { emoji: "🏠", label: "Asrama Putri", large: false },
                    { emoji: "🍽️", label: "Kantin Sehat", large: false },
                  ].map((item, i) => (
                    <div
                      key={item.label}
                      className={`rounded-xl flex items-end p-2 ${item.large ? "col-span-2 row-span-2" : ""}`}
                      style={{
                        background: "hsl(var(--primary)/0.08)",
                        minHeight: item.large ? "160px" : "80px",
                      }}
                    >
                      <div className="w-full">
                        <span className={`block ${item.large ? "text-5xl" : "text-3xl"} mb-1`}>{item.emoji}</span>
                        <span className="text-xs font-semibold">{item.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right – Ekstrakurikuler */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Kegiatan Ekstrakurikuler</h2>
                <Link
                  href={`${base}/ekstrakurikuler`}
                  className="text-xs font-medium hover:underline"
                  style={{ color: "hsl(var(--primary))" }}
                >
                  Lihat Semua Ekstrakurikuler →
                </Link>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {[
                  { emoji: "📖", name: "Tahfidz Al-Qur'an", desc: "Menghafal dengan metode talaqi dan musyafahah" },
                  { emoji: "✍️", name: "Kaligrafi", desc: "Seni menulis indah kaligrafi Arab" },
                  { emoji: "⚽", name: "Futsal", desc: "Olahraga futsal rutin setiap minggu" },
                  { emoji: "🤖", name: "Robotics", desc: "Robotika dan pemrograman dasar" },
                  { emoji: "🎤", name: "Public Speaking", desc: "Latihan pidato dan presentasi" },
                ].map((activity) => (
                  <div key={activity.name} className="flex flex-col items-center">
                    <div
                      className="h-14 w-14 rounded-full flex items-center justify-center text-2xl"
                      style={{ background: "hsl(var(--primary)/0.1)" }}
                    >
                      {activity.emoji}
                    </div>
                    <p className="text-xs font-semibold text-center mt-2 leading-tight">{activity.name}</p>
                    <p className="text-[10px] text-muted-foreground text-center mt-1 leading-tight">{activity.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Section 8: CTA Banner ── */}
      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className="relative rounded-2xl overflow-hidden px-8 py-10"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.8) 100%)",
            }}
          >
            {/* Dot pattern overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                opacity: 0.1,
                backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />

            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Left */}
              <div className="max-w-lg">
                <h2 className="text-2xl font-extrabold text-white mb-2">
                  Bergabunglah Bersama Kami!
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
                  Daftarkan putra-putri Anda sekarang dan jadikan mereka bagian dari generasi Islami yang unggul, berakhlak mulia, dan berdaya saing global.
                </p>
              </div>

              {/* Right – Buttons */}
              <div className="flex flex-wrap gap-3 shrink-0">
                <Link
                  href={`${base}/contact`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold shadow transition-all hover:opacity-90"
                  style={{ background: "white", color: "hsl(var(--primary))" }}
                >
                  Daftar Sekarang →
                </Link>
                <Link
                  href={`${base}/ppdb`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:bg-white/10"
                  style={{ border: "2px solid rgba(255,255,255,0.4)" }}
                >
                  Informasi PPDB
                </Link>
              </div>
            </div>

            {/* Decorative mosque */}
            <span
              className="absolute right-8 bottom-0 leading-none select-none pointer-events-none"
              style={{ fontSize: "8rem", opacity: 0.1 }}
            >
              🕌
            </span>
          </div>
        </div>
      </section>
    </main>
  )
}
