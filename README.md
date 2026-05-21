# FinanceFlow

PWA d'épargne et d'investissement personnel. Stack : Next.js 14 + TypeScript + Anthropic Claude pour l'analyse IA.

## Structure

```
financeflow/
├── app/
│   ├── api/ai-advice/route.ts   ← API route → Anthropic
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── FinanceFlow.tsx           ← App complète (quiz, dashboard, suivi)
├── public/
│   └── manifest.json             ← PWA manifest
└── .env.example
```

## Déploiement Vercel (5 min)

### 1. Crée le repo GitHub

```bash
cd financeflow
git init
git add .
git commit -m "init: FinanceFlow PWA"
gh repo create financeflow --public --push --source=.
```

### 2. Importe sur Vercel

- Va sur [vercel.com/new](https://vercel.com/new)
- Importe le repo `financeflow`
- Framework : **Next.js** (auto-détecté)

### 3. Ajoute la variable d'environnement

Dans **Settings → Environment Variables** :

| Key | Value |
|-----|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` |

Récupère ta clé sur [console.anthropic.com](https://console.anthropic.com)

### 4. Deploy

Clique **Deploy** → ton app est live en ~60 secondes.

## Dev local

```bash
npm install
cp .env.example .env.local
# Remplis ANTHROPIC_API_KEY dans .env.local
npm run dev
```

## Fonctionnalités

- **Questionnaire profil** (6 questions) → profil Prudent / Équilibré / Dynamique avec allocation recommandée
- **Dashboard marché** → données live simulées + analyse IA quotidienne via Claude
- **Suivi des placements** → saisie manuelle, calcul de performance, persistance localStorage

## Roadmap possible

- Intégration API marché réelle (Alpha Vantage, Yahoo Finance)
- Authentification Supabase + sync cloud (même stack que PacePro)
- Graphes de performance (recharts)
- Alertes email sur seuils de variation
