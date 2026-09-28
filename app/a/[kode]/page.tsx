import { inventory } from "@/lib/inventory"
import { AssetDetailView } from "@/components/asset-detail-view"

export function generateStaticParams() {
  return inventory.map((i) => ({ kode: encodeURIComponent(i.kode) }))
}

export default async function AssetPage({ params }: { params: Promise<{ kode: string }> }) {
  const { kode } = await params
  const decoded = decodeURIComponent(kode)
  const initialItem = inventory.find((i) => i.kode === decoded) || null

  return <AssetDetailView initialItem={initialItem} kode={decoded} />
}
