# suzu-prospection

CRM prospection devs — Convex (free plan) + Next.js 16 + ShadCN + TanStack Query · responsive

## Stack
- Next.js 16.3.4 (App Router, Tailwind v4)
- Convex 1.45.0 (real-time DB, anti-doublon)
- ShadCN (base-nova, base-ui)
- TanStack Query 5.102.8

## Dev local

```bash
pnpm install
npx convex dev        # connecte Convex (crée le projet suzu-prospection, génère .env.local + convex/_generated)
pnpm dev              # http://localhost:3000
```

## Schéma (anti-doublon)
- `emailNormalized` (lowercase) → index `by_emailNormalized` unique via mutation
- `githubUsername` → index `by_github`
- `sourceUrl` obligatoire (RGPD)
- `status`: new → verified → queued → sent → bounced/replied/opted_out

## Deploy
- Vercel: connecte le repo GitHub, set `NEXT_PUBLIC_CONVEX_URL` (from `npx convex deploy`)
- Convex: `npx convex deploy` (prod)

