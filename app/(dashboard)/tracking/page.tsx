import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

export default function TrackingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Suivi des modifications</h1>
        <p className="text-muted-foreground">
          Suivez l&apos;impact de vos optimisations de titres
        </p>
      </div>

      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Aucune modification à suivre</CardTitle>
          <CardDescription>
            Lorsque vous optimiserez des titres de produits, vous pourrez suivre
            leur impact ici après 15 jours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            Fonctionnalité en cours de développement...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
