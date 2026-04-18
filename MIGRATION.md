# Migration Guide: Replit → Vercel + Supabase

## Summary of Changes

Your project has been configured to deploy on **Vercel** with **Supabase** as the database. Here's what was changed:

### 1. **Files Created/Updated**
- ✅ `.env.example` — Environment variables for Supabase + Vercel
- ✅ `vercel.json` — Deployment configuration for Vercel
- ✅ `artifacts/cristina-site/vite.config.ts` — Removed Replit plugins
- ✅ `artifacts/api-server/src/index.ts` — Added Vercel serverless support
- ✅ `api/index.ts` — Vercel serverless handler
- ✅ Root `package.json` — Added Vercel-compatible scripts
- ✅ `artifacts/cristina-site/package.json` — Removed Replit dependencies

### 2. **Removed Dependencies**
Replit-specific plugins removed from `@workspace/cristina-site`:
- `@replit/vite-plugin-cartographer`
- `@replit/vite-plugin-dev-banner`
- `@replit/vite-plugin-runtime-error-modal`

### 3. **Architecture Changes**
- **Frontend**: React + Vite → Vercel (static hosting)
- **API**: Express (standalone) → Vercel serverless functions
- **Database**: PostgreSQL → Supabase (PostgreSQL-compatible)
- **Environment**: Replit → Vercel

---

## Setup Instructions

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project (select **eu-central-1** region)
3. Copy your connection string from **Project Settings > Database > Connection string**
   - Choose **Nodejs** tab for connection string format

### Step 2: Update Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Copy from Supabase
DATABASE_URL=postgresql://postgres:[password]@db.supabase.co:5432/postgres

# Supabase (optional, for future features)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# API
NODE_ENV=production
PORT=3000

# Frontend
BASE_PATH=/
VITE_API_URL=http://localhost:3000/api  # for local dev

# Creator
VITE_CREATOR_PASSWORD=cristina2024
```

### Step 3: Push Database Schema to Supabase

```bash
# Install dependencies if needed
pnpm install

# Push the schema to Supabase
pnpm --filter @workspace/db run push
```

### Step 4: Local Development

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev

# Run API server separately (if needed)
pnpm --filter @workspace/api-server run dev
```

### Step 5: Deploy to Vercel

1. **Push your code to GitHub**
   ```bash
   git add -A
   git commit -m "Migration: Replit to Vercel + Supabase"
   git push
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables:
     - `DATABASE_URL` from Supabase
     - `VITE_API_URL=https://your-project.vercel.app/api` (after first deploy)
     - `VITE_CREATOR_PASSWORD=cristina2024`
   - Click **Deploy**

3. **Update Frontend API URL** (after first deployment)
   - After Vercel deploys, set `VITE_API_URL` to your Vercel domain:
     ```
     VITE_API_URL=https://your-project.vercel.app/api
     ```
   - Redeploy to use the production API

---

## How It Works

### API Routing
- All `/api/*` requests are routed to the Vercel serverless function `api/index.ts`
- The function loads the compiled Express app and handles the request
- No changes needed to your API code—it works the same way

### Database Connection
- Your existing database schema (in `lib/db/src/schema`) is unchanged
- Drizzle ORM connects via `DATABASE_URL` environment variable
- Supabase provides a PostgreSQL database that works with Drizzle ORM

### Frontend Build
- React + Vite frontend builds to static files
- Served from Vercel's edge network
- All non-API routes fallback to `index.html` for client-side routing

---

## Troubleshooting

### `DATABASE_URL not found`
- Ensure `.env.local` is in the root directory
- Check the connection string copied from Supabase (it should start with `postgresql://`)
- Don't commit `.env.local`—add it to `.gitignore`

### API returns 502 error in production
- Check Vercel logs: go to your project → **Functions** tab
- Ensure `DATABASE_URL` is set in Vercel environment variables
- Check network connectivity to Supabase

### Local API not connecting
- Run `pnpm install` to ensure all dependencies installed
- Check `PORT` is set to 3000 in `.env.local`
- Verify `DATABASE_URL` is correct

### Build fails
- Run `pnpm run typecheck` locally to catch TypeScript errors
- Run `pnpm run build` to test the full build locally
- Check build logs in Vercel dashboard

---

## Next Steps

1. ✅ Push code to GitHub
2. ✅ Set up Supabase project
3. ✅ Deploy to Vercel
4. ✅ Test API endpoints
5. 📋 Update creator dashboard password (optional)
6. 📋 Add custom domain to Vercel (optional)

---

## Key Environment Variables Reference

| Variable | Source | Usage |
|---|---|---|
| `DATABASE_URL` | Supabase | Database connection |
| `VITE_API_URL` | Vercel URL | Frontend API calls |
| `VITE_CREATOR_PASSWORD` | Your choice | Creator dashboard auth |
| `NODE_ENV` | Set to `production` | Express behavior |

---

## Database Migrations

If you need to update the database schema:

```bash
# Edit schema in lib/db/src/schema/
# Then push changes:
pnpm --filter @workspace/db run push
```

This uses Drizzle migrations and is safe for production.

---

**Questions?** Check logs with `pnpm run typecheck` and `pnpm run build` before deployment.
