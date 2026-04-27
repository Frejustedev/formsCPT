# Registre Cancer Thyroïde — Dossier CDT

Application web sécurisée de suivi des cancers différenciés de la thyroïde (CDT). Le formulaire reflète exactement la **Fiche Guide CDT** (38 champs) avec choix prédéfinis pour chaque champ catégoriel.

## Stack

- **Front** : Next.js 15 (App Router), React 19, TypeScript, Tailwind 4, shadcn/ui
- **Backend** : Firebase Auth (Google) + Firestore
- **Formulaires** : React Hook Form + Zod
- **Export** : jsPDF + jspdf-autotable, XLSX (SheetJS)
- **PWA** : manifest natif Next + service worker avec stratégie de cache
- **Tests** : Vitest

## Démarrage rapide

### Prérequis
- Node.js 20+
- Un projet Firebase (Firestore + Authentication Google activés)
- L'email du super-administrateur

### Installation

```bash
git clone https://github.com/Frejustedev/formsCPT.git
cd formsCPT
npm install
cp .env.example .env.local       # puis remplir NEXT_PUBLIC_SUPER_ADMIN_EMAIL
npm run dev
```

L'application est disponible sur http://localhost:3000.

### Configuration Firebase

`firebase-applet-config.json` contient la configuration publique du projet Firebase. Pour utiliser votre propre projet, remplacez ses valeurs par celles de votre projet (Firebase console → ⚙️ → *Project settings* → *General* → *Your apps*).

Activez :
- **Authentication** → fournisseur **Google**
- **Firestore Database** (mode production)

Déployez les règles de sécurité :

```bash
npx firebase deploy --only firestore:rules
```

### Variables d'environnement

| Nom | Obligatoire | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPER_ADMIN_EMAIL` | non (défaut : `agbotonfrejuste@gmail.com`) | Email avec droits admin permanents |
| `GEMINI_API_KEY` | non | Si vous activez les fonctionnalités IA |
| `APP_URL` | non | URL publique (utile en production) |
| `DISABLE_HMR` | non | Désactive le HMR en dev |

## Modèle de données — 38 champs

Le formulaire est aligné sur `Fiche_Guide_CDT.xlsx` :

| Onglet | Champs |
|---|---|
| **Identification** | numeroDossier, nom, prenoms, sexe, ddn, wilaya |
| **Antécédents** | atcdFamCdt, atcdFamCancer, atcdPersCancer, ageDgc |
| **Tumeur** | cdt, variante, taille, ec, macroMicro, ev, evCount, mitoses, hgie, nse, filetNerv, r, t, n, m |
| **Traitement & Suivi** | chir, cg, tps, dgcI1, chirI1, nbreCures, actCum, suivi, rep2ans, rep5ans, rep10ans, dcd, dcdAge |

Tous les choix prédéfinis sont centralisés dans [lib/options.ts](lib/options.ts). Les Wilayas sont dans [lib/wilayas.ts](lib/wilayas.ts).

## Collections Firestore

| Collection | Rôle |
|---|---|
| `records/{id}` | Dossiers patients |
| `records/{id}/versions/{ts}` | **Audit-trail** : snapshot de l'état précédent à chaque update |
| `drafts/{uid}` | Brouillons auto-sauvés (un par utilisateur) |
| `users/{uid}` | Profil minimal créé à la connexion |
| `admins/{uid}` | Accès administrateur |
| `logs/{id}` | Journal d'activité |

Les règles dans `firestore.rules` :
- Refusent tout par défaut
- Vérifient le format de chaque champ (taille, type, enum implicite)
- Imposent que `userId` et `createdAt` soient immuables sur update
- Limitent les clés modifiables à la liste explicite des 37 champs métier (voir `recordEditableKeys` dans `firestore.rules`)
- Empêchent la modification ou la suppression des snapshots de version

## Scripts

```bash
npm run dev         # serveur Next.js de développement
npm run build       # build production
npm run start       # lance le build production
npm run lint        # ESLint
npm run typecheck   # TypeScript --noEmit
npm test            # Vitest (run unique)
npm run test:watch  # Vitest watch
```

## Tests

Couverture initiale dans `tests/` :
- `schemas.test.ts` : valide tous les enums, le format `numeroDossier`, le rejet des valeurs hors enum, le helper `formatTNM`
- `migrate.test.ts` : valide la migration des dossiers legacy (anciens codes M/F/O/N/NP) vers les nouveaux libellés

## Sécurité — points clés

- Headers HTTP : CSP, HSTS, X-Frame-Options, Permissions-Policy (voir `next.config.ts`)
- Auth Google obligatoire ; super-admin via env var ou custom claim
- Règles Firestore strictes (`firestore.rules`) — un dossier ne peut être lu que par son propriétaire ou un admin
- Audit-trail automatique : chaque update crée un snapshot dans `records/{id}/versions/{ts}`
- Pas de données médicales en localStorage (les brouillons vivent uniquement dans Firestore)

## Migration depuis l'ancien schéma

Si vous avez des dossiers créés avec l'ancien schéma (`sexe = 'M'/'F'/'NP'`, `dcd = 'O'/'N'`, etc.), un mapper [lib/migrate.ts](lib/migrate.ts) transforme automatiquement les valeurs au moment de la lecture. Les données ne sont **pas** réécrites en base : pour les normaliser, ouvrez et sauvegardez chaque dossier (la valeur migrée est alors persistée).

## Architecture

```
app/
  layout.tsx            ErrorBoundary + Firebase + Theme + AppShell
  page.tsx              Dashboard
  manifest.ts           Manifest PWA (source unique)
  records/new           Création d'un dossier
  records/[id]          Édition
  admin/                Panneau admin
components/
  AppShell, Dashboard, RecordForm, AdminPanel
  FirebaseProvider      Contexte + helpers (createMedicalRecord, updateMedicalRecord, isNumeroDossierTaken, logAction)
  ErrorBoundary
lib/
  schemas.ts            Zod + types + labels + RECORD_DEFAULTS
  options.ts            Constantes des choix prédéfinis
  wilayas.ts            58 wilayas algériennes (data validation Excel)
  migrate.ts            Mapper legacy → nouveau schéma
public/
  sw.js                 Service worker (cache statique + runtime)
firestore.rules         Règles de sécurité
firebase-blueprint.json Schéma JSON des collections
```

## Licence

Privé — usage interne au registre.
