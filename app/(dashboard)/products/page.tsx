import { ProductsPageClient } from "@/components/products/ProductsPageClient"

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Produits</h1>
        <p className="text-muted-foreground">
          Visualisez et optimisez vos titres produits
        </p>
      </div>

      <ProductsPageClient />
    </div>
  )
}
