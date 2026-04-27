import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

const defaultServices = [
  { title: "Konsultasi", description: "Konsultasi profesional untuk membantu Anda menemukan solusi terbaik sesuai kebutuhan.", icon: "💡" },
  { title: "Pengembangan", description: "Pengembangan produk dan layanan dengan standar kualitas tinggi dan teknologi terkini.", icon: "🚀" },
  { title: "Pelatihan", description: "Program pelatihan komprehensif untuk meningkatkan kompetensi tim Anda.", icon: "📚" },
  { title: "Dukungan Teknis", description: "Dukungan teknis 24/7 untuk memastikan operasional Anda berjalan lancar.", icon: "🛠️" },
  { title: "Manajemen Proyek", description: "Pengelolaan proyek end-to-end dengan metodologi yang teruji.", icon: "📋" },
  { title: "Analisis Data", description: "Analisis data mendalam untuk pengambilan keputusan yang lebih baik.", icon: "📊" },
]

export default async function ServicesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await db.tenant.findUnique({
    where: { slug },
    select: { name: true, slug: true, services: true },
  })
  if (!tenant) notFound()

  const services: { title: string; description: string; icon: string }[] =
    (tenant.services as any[]) || defaultServices
  const base = `/site/${slug}`

  return (
    <>
      <section className="bg-mesh py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-primary mb-2">Layanan</p>
          <h1 className="text-4xl font-bold tracking-tight">Layanan Kami</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            Kami menyediakan berbagai layanan profesional untuk memenuhi kebutuhan bisnis Anda.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((svc, i) => (
            <div key={i} className="group rounded-2xl border bg-background p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="text-4xl mb-4">{svc.icon || "⚡"}</div>
              <h3 className="text-lg font-semibold mb-2">{svc.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{svc.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="rounded-3xl bg-muted/50 border p-12 text-center">
          <h2 className="text-2xl font-bold">Butuh Layanan Khusus?</h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Kami juga menerima permintaan layanan yang disesuaikan dengan kebutuhan spesifik Anda.
          </p>
          <Link href={`${base}/contact`} className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl btn-gradient text-white font-medium">
            Konsultasi Gratis <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  )
}
