export const TITLE_OPTIMIZATION_PROMPT = `Tu es un expert en optimisation de titres de produits pour Google Shopping. Ton objectif est de maximiser le taux de clic (CTR) tout en respectant les bonnes pratiques Google.

## Contexte du produit

Titre actuel: {title}
Description: {description}
Prix: {price} {currency}
Marque: {brand}
Catégorie Google: {googleCategory}
Catégorie marchand: {productType}
GTIN: {gtin}
État: {condition}

## Métriques actuelles (14 derniers jours)

- Clics gratuits: {freeClicks}
- Clics payants: {adsClicks}
- Impressions totales: {totalImpressions}
- CTR estimé: {ctr}%

## Règles d'optimisation

1. **Structure optimale**: [Marque] + [Nom produit] + [Attributs clés] + [Différenciateur]
2. **Longueur**: Entre 70 et 150 caractères (Google tronque au-delà)
3. **Mots-clés**: Placer les mots-clés les plus importants en début de titre
4. **Attributs à inclure** (si pertinents): couleur, taille, matière, capacité, modèle
5. **À éviter**:
   - MAJUSCULES EXCESSIVES
   - Caractères spéciaux inutiles
   - Répétitions de mots
   - Termes promotionnels ("Promo", "Pas cher", "-50%")
   - Termes subjectifs ("Meilleur", "Top qualité")

## Format de réponse

Génère exactement 3 suggestions de titres optimisés. Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après:

{
  "suggestions": [
    {
      "title": "Le titre optimisé ici",
      "reasoning": "Explication courte de pourquoi ce titre est meilleur",
      "changes": ["Changement 1", "Changement 2"]
    },
    {
      "title": "Deuxième suggestion",
      "reasoning": "Explication",
      "changes": ["Changement 1"]
    },
    {
      "title": "Troisième suggestion",
      "reasoning": "Explication",
      "changes": ["Changement 1", "Changement 2"]
    }
  ]
}`

export interface TitleSuggestion {
  title: string
  reasoning: string
  changes: string[]
}

export interface OptimizationResult {
  suggestions: TitleSuggestion[]
}

export function buildPrompt(product: {
  title: string
  description?: string | null
  price?: number | null
  currency?: string
  brand?: string | null
  googleCategory?: string | null
  productType?: string | null
  gtin?: string | null
  condition?: string | null
  freeClicks: number
  adsClicks: number
  totalImpressions: number
}): string {
  const totalClicks = product.freeClicks + product.adsClicks
  const ctr =
    product.totalImpressions > 0
      ? ((totalClicks / product.totalImpressions) * 100).toFixed(2)
      : "0"

  return TITLE_OPTIMIZATION_PROMPT.replace("{title}", product.title)
    .replace("{description}", product.description || "Non renseignée")
    .replace("{price}", product.price?.toFixed(2) || "Non renseigné")
    .replace("{currency}", product.currency || "EUR")
    .replace("{brand}", product.brand || "Non renseignée")
    .replace("{googleCategory}", product.googleCategory || "Non renseignée")
    .replace("{productType}", product.productType || "Non renseignée")
    .replace("{gtin}", product.gtin || "Non renseigné")
    .replace("{condition}", product.condition || "Non renseigné")
    .replace("{freeClicks}", String(product.freeClicks))
    .replace("{adsClicks}", String(product.adsClicks))
    .replace("{totalImpressions}", String(product.totalImpressions))
    .replace("{ctr}", ctr)
}
