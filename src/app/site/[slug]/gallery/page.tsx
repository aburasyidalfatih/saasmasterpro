import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { ImageIcon } from "lucide-react"

export default async function GalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await db.tenant.findUnique({
    where: { slug },
    select: { name: true, gallery: true },
  })
  if (!tenant) notFound()

  const gallery = (tenant.gallery as string[]) || []

  return (
    <>
      <section className="bg-mesh py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-primary mb-2">Galeri</p>
          <h1 className="text-4xl font-bold tracking-tight">Galeri Kami</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            Dokumentasi kegiatan dan portofolio pekerjaan kami.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        {gallery.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {gallery.map((url, i) => (
              <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden border">
                <img src={url} alt={`Gallery ${i + 1}`} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Galeri Belum Tersedia</h3>
            <p className="text-muted-foreground">Foto dan dokumentasi akan segera ditambahkan.</p>
          </div>
        )}
      </section>
    </>
  )
}
