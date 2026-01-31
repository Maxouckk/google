import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Mail, ArrowLeft } from "lucide-react"

export default function VerifyEmailPage() {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold text-center">
          Vérifiez votre email
        </CardTitle>
        <CardDescription className="text-center">
          Nous vous avons envoyé un email de confirmation. Cliquez sur le lien
          dans l&apos;email pour activer votre compte.
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex flex-col space-y-4">
        <p className="text-sm text-center text-muted-foreground">
          Vous n&apos;avez pas reçu l&apos;email ? Vérifiez vos spams ou{" "}
          <Link href="/signup" className="text-primary hover:underline">
            réessayez avec une autre adresse
          </Link>
        </p>
        <Link href="/login" className="w-full">
          <Button variant="ghost" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la connexion
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
