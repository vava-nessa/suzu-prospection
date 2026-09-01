# Deploy suzu-prospection

## 1. Convex (free plan)
```bash
cd suzu-prospection
npx convex dev
# → login GitHub dans le navigateur
# → crée le projet "suzu-prospection"
# → génère .env.local (NEXT_PUBLIC_CONVEX_URL) + convex/_generated/*
# → laisse tourner, puis Ctrl+C
# Pour prod:
npx convex deploy
# → note le NEXT_PUBLIC_CONVEX_URL de prod
```

## 2. Vercel
Option A — Dashboard (recommandé):
1. https://vercel.com/new → Import `vava-nessa/suzu-prospection`
2. Framework: Next.js (auto)
3. Env var: `NEXT_PUBLIC_CONVEX_URL` = valeur de prod (ou dev pour preview)
4. Deploy → https://suzu-prospection.vercel.app

Option B — CLI:
```bash
npx vercel login
npx vercel --prod
# set env:
npx vercel env add NEXT_PUBLIC_CONVEX_URL production
```

## 3. Vérif
- Ouvre ton URL Vercel → tableau visible
- Ajoute un prospect → check realtime (autre onglet)
- Test anti-doublon: ré-ajoute même email → "Doublon détecté"

## Scraper (plus tard)
```ts
// scripts/scrape.ts
import { ConvexClient } from "convex/browser";
import { api } from "../convex/_generated/api";
const client = new ConvexClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
await client.mutation(api.prospects.upsert, { email: "...", sourceType: "github", sourceUrl: "..." });
```
