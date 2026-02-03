# Merchant Center Title Optimizer

## Vision du projet

Application SaaS permettant aux e-commerçants français d'optimiser leurs titres produits Google Shopping grâce à l'intelligence artificielle (Claude), avec mesure d'impact automatique pour valider les améliorations.

## Stack technique

- **Framework** : Next.js 14 (App Router)
- **Langage** : TypeScript
- **Base de données** : Supabase (PostgreSQL + Auth)
- **UI** : Tailwind CSS + shadcn/ui (Radix)
- **IA** : Anthropic Claude API (claude-sonnet-4-20250514)
- **APIs Google** : Content API for Shopping v2.1 + Google Ads API v16
- **Chiffrement** : AES-256-GCM pour tokens et credentials

---

## Architecture du projet

```
app/
├── (auth)/                    # Pages d'authentification
│   ├── login/
│   ├── signup/
│   ├── forgot-password/
│   ├── reset-password/
│   └── verify-email/
├── (dashboard)/               # Pages protégées (route group)
│   ├── accounts/              # Gestion des comptes Google
│   ├── products/              # Liste et optimisation des produits
│   ├── tracking/              # Suivi des changements de titres
│   ├── settings/              # Paramètres utilisateur
│   ├── layout.tsx             # Layout avec sidebar + header
│   ├── loading.tsx            # État de chargement
│   └── error.tsx              # Boundary d'erreur
├── api/
│   ├── auth/google/           # OAuth Google (merchant + ads)
│   ├── credentials/           # CRUD credentials Google par utilisateur
│   ├── merchant/[accountId]/  # Sync produits + optimisation IA
│   ├── ads/[adsAccountId]/    # Sync métriques Google Ads
│   ├── products/              # Liste produits avec filtres
│   ├── tracking/              # Liste changements + rollback
│   ├── cron/                  # Mesure d'impact automatique
│   └── profile/               # Profil utilisateur
├── page.tsx                   # Landing page publique
└── layout.tsx                 # Layout racine

components/
├── accounts/                  # GoogleCredentialsForm, MerchantAccountCard, etc.
├── auth/                      # LoginForm, SignupForm, etc.
├── layout/                    # DashboardShell, Header, Sidebar, AccountSelector
├── products/                  # ProductsTable, ProductsFilters, OptimizeModal
├── tracking/                  # TrackingTable, TrackingFilters
├── settings/                  # SettingsPageClient
└── ui/                        # Composants shadcn/ui

lib/
├── google/
│   ├── oauth.ts               # Fonctions OAuth (auth URL, exchange tokens)
│   ├── merchant.ts            # API Merchant Center (produits, métriques)
│   ├── ads.ts                 # API Google Ads (métriques Shopping)
│   ├── token-manager.ts       # Gestion refresh tokens automatique
│   └── user-credentials.ts    # Récupération credentials chiffrés
├── claude/
│   ├── client.ts              # Client Anthropic
│   └── prompts.ts             # Prompt d'optimisation de titres
├── supabase/
│   ├── client.ts              # Client navigateur
│   ├── server.ts              # Client serveur (cookies)
│   ├── admin.ts               # Client admin (service role)
│   └── middleware.ts          # Protection des routes
└── encryption.ts              # AES-256-GCM encrypt/decrypt

contexts/
└── AccountContext.tsx         # État global de sélection de compte

hooks/
├── useProducts.ts             # Fetch produits avec pagination/filtres
└── useTracking.ts             # Fetch changements de titres

types/
└── database.ts                # Types Supabase générés
```

---

## Schéma de base de données

### `users`
Profils utilisateurs (géré par Supabase Auth).

### `user_google_credentials`
Identifiants Google OAuth par utilisateur (chiffrés AES-256-GCM).
- `google_client_id_encrypted`
- `google_client_secret_encrypted`

### `merchant_accounts`
Comptes Merchant Center connectés.
- Tokens OAuth chiffrés
- Statut de sync (dernière sync, erreurs)
- Nombre de produits

### `google_ads_accounts`
Comptes Google Ads connectés (optionnel).
- Lien vers `merchant_account` (facultatif)
- Tokens OAuth chiffrés

### `products`
Produits synchronisés depuis Merchant Center.
- `title_original` / `title_current`
- Métriques gratuites : `free_clicks_14d/30d/90d/365d`, `free_impressions_*`
- Métriques Ads : `ads_clicks_*`, `ads_impressions_*`, `ads_cost_*`, `ads_conversions_*`
- Métriques totales : `total_clicks_*` (free + ads)
- `optimization_status` : original | testing | optimized | rolled_back
- `times_optimized`

### `title_changes`
Historique des modifications de titres.
- `old_title` / `new_title`
- `change_source` : ai_suggestion | manual
- `ai_reasoning` : explication de l'IA
- Métriques avant/après (14j)
- `impact_status` : pending | positive | neutral | negative
- `rolled_back_at` / `rollback_reason`

### `ai_generation_logs`
Logs des appels à Claude.
- Prompt envoyé
- Suggestions générées (JSON)
- Tokens input/output
- Temps de réponse
- Suggestion sélectionnée

---

## Fonctionnalités principales

### 1. Authentification
- Inscription/connexion par email (Supabase Auth)
- Réinitialisation de mot de passe
- Vérification d'email
- Protection des routes via middleware

### 2. Configuration Google OAuth (par utilisateur)
- Chaque utilisateur configure ses propres identifiants Google Cloud
- Client ID + Client Secret stockés chiffrés (AES-256-GCM)
- Guide étape par étape dans l'interface
- URIs de redirection affichées pour configuration

### 3. Connexion Merchant Center
- OAuth 2.0 avec scope `content`
- Import automatique de tous les comptes accessibles
- Tokens refresh automatique avant expiration

### 4. Synchronisation des produits
- Import depuis Content API for Shopping
- Récupération des métriques (clics, impressions) sur 14/30/90/365 jours
- Stockage du titre original vs actuel
- Sync manuelle ou automatique

### 5. Optimisation IA des titres
- 3 suggestions générées par Claude
- Basées sur :
  - Attributs produit (marque, catégorie, GTIN, etc.)
  - Performances actuelles (CTR, clics)
  - Best practices Google Shopping
- Raisonnement fourni pour chaque suggestion
- Logging complet (tokens, temps, sélection)

### 6. Application des titres
- Mise à jour directe dans Merchant Center
- Enregistrement dans `title_changes`
- Passage en statut "testing"
- Possibilité de rollback à tout moment

### 7. Mesure d'impact automatique
- Cron job après 15 jours
- Comparaison métriques avant/après
- Classification : positive (>+10%) | neutral | negative (<-10%)
- Mise à jour du statut produit

### 8. Google Ads (optionnel)
- Connexion OAuth séparée
- Import métriques Shopping (clics, impressions, coût, conversions)
- Calcul des métriques totales (free + ads)
- Liaison avec compte Merchant

### 9. Multi-comptes
- Plusieurs comptes Merchant Center par utilisateur
- Sélecteur global dans le header
- Données isolées par compte

---

## Variables d'environnement

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Google Ads (optionnel - pour les métriques Ads)
GOOGLE_ADS_DEVELOPER_TOKEN=xxxxx

# Claude / Anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Chiffrement (32 caractères)
ENCRYPTION_KEY=votre-cle-secrete-32-caracteres!

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=random-secret-for-cron-auth
```

**Note** : Les identifiants Google OAuth (Client ID/Secret) sont configurés PAR UTILISATEUR via l'interface, pas dans les variables d'environnement.

---

## Flux utilisateur

1. **Inscription** → Création compte Supabase
2. **Configuration Google** → Entrée Client ID + Secret (chiffrés)
3. **Connexion Merchant Center** → OAuth → Import comptes
4. **Sync produits** → Récupération depuis Google
5. **Optimisation** → Sélection produit → Génération suggestions IA
6. **Application** → Titre mis à jour dans Google + enregistré
7. **Mesure** → Après 15j, comparaison automatique des métriques
8. **Itération** → Rollback si négatif, continuer si positif

---

## Sécurité

- **Chiffrement AES-256-GCM** : tokens OAuth et credentials Google
- **RLS Supabase** : isolation des données par utilisateur
- **CSRF** : validation du state parameter OAuth
- **Middleware** : protection des routes dashboard
- **Service Role** : opérations sensibles côté serveur uniquement
- **Pas de secrets côté client** : toutes les clés sensibles sont serveur-only

---

## Scripts

```bash
npm run dev       # Développement
npm run build     # Build production
npm run start     # Serveur production
npm run lint      # ESLint
```

---

## Migrations Supabase

Les migrations SQL sont dans `supabase/migrations/` :
- `001_users.sql` - Table users
- `002_merchant_accounts.sql` - Comptes Merchant Center
- `003_products.sql` - Produits et métriques
- `004_title_changes.sql` - Historique des changements
- `005_user_google_credentials.sql` - Credentials OAuth par utilisateur

Exécuter dans **Supabase Dashboard > SQL Editor**.

---

## Prochaines évolutions possibles

- [ ] Optimisation en masse (plusieurs produits)
- [ ] Règles d'optimisation automatiques (si CTR < X%, suggérer)
- [ ] Intégration autres marketplaces (Amazon, eBay)
- [ ] A/B testing de titres
- [ ] Rapports PDF exportables
- [ ] Webhooks pour notifications
- [ ] API publique pour intégrations tierces
