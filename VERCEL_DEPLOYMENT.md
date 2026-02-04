# Vercel Deployment Guide for Tref Stays

## Pre-Deployment Checklist

✅ **Project Configuration Complete:**
- `vercel.json` - Vercel deployment configuration
- `.env.example` - Environment variables template
- `.vercelignore` - Files to exclude from deployment
- Updated `.gitignore` - Exclude sensitive files
- Updated `package.json` - Added `vercel-build` and `start` scripts
- Updated `server.js` - Production-ready CORS configuration

## Database Connection

✅ **Render PostgreSQL Database:**
Your project is already configured to use Render PostgreSQL:
```
DATABASE_URL=postgresql://trefstays_user:GZDT34HeX7aHIcnYlDHPwr5mZJoXxDjQ@dpg-d61nnksoud1c73agi30g-a.oregon-postgres.render.com/trefstays
```

This connection will remain active and accessible from Vercel.

## Step-by-Step Deployment

### 1. Push to GitHub (if not already done)

```bash
cd "d:\Tref Website\Testing\ya last ha final ala - Copy\ivr\tref-stays-design\tref-stays-main"
git init
git add .
git commit -m "Initial commit for Vercel deployment"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 2. Deploy to Vercel

**Option A: Using Vercel Dashboard (Recommended)**

1. Go to https://vercel.com and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset:** Vite
   - **Root Directory:** ./
   - **Build Command:** `npm run vercel-build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

**Option B: Using Vercel CLI**

```bash
# Install Vercel CLI globally
npm install -g vercel

# Deploy from project directory
cd "d:\Tref Website\Testing\ya last ha final ala - Copy\ivr\tref-stays-design\tref-stays-main"
vercel
```

### 3. Configure Environment Variables in Vercel

Go to your Vercel project dashboard → Settings → Environment Variables

Add these variables:

**Supabase Config:**
```
VITE_SUPABASE_PROJECT_ID=vprxeabfsxmxmkihxvxn
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwcnhlYWJmc3hteG1raWh4dnhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMTEyMjksImV4cCI6MjA4NTc4NzIyOX0.9-wdaoUHbtpzzsTBlXgDTThICjovdGXg-d4aVIvmOPs
VITE_SUPABASE_URL=https://vprxeabfsxmxmkihxvxn.supabase.co
```

**Render PostgreSQL Database:**
```
DATABASE_URL=postgresql://trefstays_user:GZDT34HeX7aHIcnYlDHPwr5mZJoXxDjQ@dpg-d61nnksoud1c73agi30g-a.oregon-postgres.render.com/trefstays
VITE_DATABASE_URL=postgresql://trefstays_user:GZDT34HeX7aHIcnYlDHPwr5mZJoXxDjQ@dpg-d61nnksoud1c73agi30g-a.oregon-postgres.render.com/trefstays
```

**API Endpoint (use your Vercel URL):**
```
VITE_API_URL=https://your-app-name.vercel.app
```

**JWT Secret:**
```
JWT_SECRET=your-secure-random-string-change-this
```

**Important:** 
- Set all variables for "Production", "Preview", and "Development" environments
- After adding variables, redeploy your app

### 4. Update API URL After Deployment

After your first deployment:

1. Note your Vercel URL (e.g., `https://tref-stays.vercel.app`)
2. Go back to Environment Variables
3. Update `VITE_API_URL` with your actual Vercel URL
4. Redeploy

### 5. Verify Database Connection

After deployment, check the Vercel Function Logs:
1. Go to your project dashboard
2. Click "Deployments"
3. Click on the latest deployment
4. Check "Functions" tab
5. Look for "✓ Connected to PostgreSQL" message

## Testing Your Deployment

1. **Frontend:** Visit your Vercel URL (e.g., https://your-app.vercel.app)
2. **API Health:** Visit https://your-app.vercel.app/api/properties
3. **Database:** Try creating a property or searching for properties
4. **Authentication:** Test login/signup functionality

## Troubleshooting

### Database Connection Issues

If you see database connection errors:
1. Verify `DATABASE_URL` is correctly set in Vercel environment variables
2. Check Render PostgreSQL dashboard - database should be running
3. Ensure SSL is enabled: `ssl: { rejectUnauthorized: false }`

### CORS Issues

If you see CORS errors:
1. Verify `VITE_API_URL` matches your Vercel URL
2. Check browser console for specific error
3. Ensure Vercel URL is added to allowed origins in server.js

### API Routes Not Working

1. Verify `vercel.json` routes configuration
2. Check Vercel Function logs for errors
3. Ensure all API endpoints are properly deployed

### Image Uploads

Note: Vercel serverless functions have limited file system access. For production:
- Consider using cloud storage (AWS S3, Cloudinary, etc.)
- Or use Vercel Blob storage
- Current uploads will work but won't persist across deployments

## Environment-Specific URLs

**Development:**
- Frontend: http://localhost:8080
- Backend: http://localhost:3000

**Production (Vercel):**
- Frontend & Backend: https://your-app-name.vercel.app
- API: https://your-app-name.vercel.app/api/*

**Database (Render):**
- Always: PostgreSQL on Render (same for dev and production)

## Automatic Deployments

Vercel will automatically deploy when you:
- Push to your main branch (production)
- Push to any branch (preview deployment)
- Create a pull request (preview deployment)

## Custom Domain (Optional)

To add a custom domain:
1. Go to Vercel project dashboard
2. Settings → Domains
3. Add your domain
4. Update DNS records as instructed

## Monitoring

Monitor your app:
- **Vercel Dashboard:** Deployments, analytics, logs
- **Render Dashboard:** Database metrics, connection pool
- **Browser DevTools:** Frontend errors and network requests

## Support

- Vercel Docs: https://vercel.com/docs
- Render Docs: https://render.com/docs
- PostgreSQL connection stays on Render - no changes needed!

---

## Quick Command Reference

```bash
# Local development
npm run dev          # Start frontend (port 8080)
npm run server       # Start backend (port 3000)
npm run dev:all      # Start both

# Build for production
npm run build        # Build frontend
npm run vercel-build # Build for Vercel

# Deploy to Vercel
vercel               # Deploy to preview
vercel --prod        # Deploy to production
```

## Files Created/Modified

✅ Created:
- `vercel.json` - Vercel configuration
- `.env.example` - Environment variables template
- `.vercelignore` - Deployment exclusions
- `VERCEL_DEPLOYMENT.md` - This guide

✅ Modified:
- `package.json` - Added deployment scripts
- `.gitignore` - Added .env and .vercel
- `server.js` - Production CORS configuration

Your Render PostgreSQL database connection remains unchanged and will work seamlessly with Vercel! 🚀
