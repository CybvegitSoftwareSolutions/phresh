# Phresh – Web Application

An e‑commerce web app for fresh juices: product browsing, cart & checkout, order confirmations, admin dashboard (products, categories, carousel, featured, shipping settings), contact/corporate forms, and a simple blog system.

Owner: asadshafique5@gmail.com

## Tech Stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn‑ui components
- Supabase (Auth, DB, Storage, Edge Functions)

## Local Development

Prerequisites: Node.js and npm (recommend installing via nvm).

```bash
git clone <REPO_URL>
cd <REPO_DIR>
npm i
npm run dev
```

Environment variables:
- Create a `.env` (or host‑specific env) with any required values (e.g. `VITE_SITE_URL`, Supabase keys).

## Branching & Environments

- `main` – development branch. Make all changes here first and test locally.
- `prod` – production branch. This is the production branch; anything merged here will be deployed to production.

Process:
1) Implement and test changes on `main` locally.
2) Open a PR to `prod` once verified.
3) Merge to `prod` → automatic production deploy.

## Deployment

Deployment is tied to the `prod` branch. Ensure production environment variables (e.g. `VITE_SITE_URL=https://beta.phresh.pk` or your final domain) are configured in your hosting provider before merging to `prod`.

## Project Structure (high level)

- `src/pages` – public pages (home, products, cart/checkout, auth, blogs, etc.)
- `src/components` – UI + admin dashboard components
- `supabase/migrations` – SQL migrations (schema, policies)
- `supabase/functions` – Edge Functions (e.g., contact/corporate processors)

## Support

For questions or issues, please contact: asadshafique5@gmail.com
