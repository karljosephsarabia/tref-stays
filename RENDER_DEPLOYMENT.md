# Render Deployment Guide - Tref Stays

## ✅ Pre-Deployment Checklist - COMPLETED

- ✅ Server configured for disk storage with Persistent Disk support
- ✅ Removed Vercel-specific code (@vercel/blob)
- ✅ Frontend build configured
- ✅ Static file serving configured
- ✅ SPA routing configured
- ✅ Environment variables ready
- ✅ CORS configured for Render
- ✅ Database connection configured

## Deployment Steps

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Configure for Render deployment with Persistent Disk"
git push origin main
```

### Step 2: Create Persistent Disk on Render

1. Go to https://dashboard.render.com/
2. Click **New +** → **Disk**
3. Configure:
   - **Name:** `tref-stays-uploads`
   - **Size:** 10 GB (or adjust based on needs)
   - **Region:** Oregon (same as your PostgreSQL database)
4. Click **Create Disk**
5. **Note the disk ID** - you'll need it in Step 4

### Step 3: Create Web Service

1. Click **New +** → **Web Service**
2. Connect your GitHub repository: `karljosephsarabia/tref-stays`
3. Configure basic settings:
   - **Name:** `tref-stays`
   - **Region:** Oregon (same as DB and disk)
   - **Branch:** `main`
   - **Root Directory:** (leave empty)
   - **Environment:** `Node`
   - **Build Command:** `npm run render-build`
   - **Start Command:** `npm start`
   - **Plan:** Select your paid plan (Standard or higher)

### Step 4: Add Environment Variables

In the **Environment** section, click **Add Environment Variable** and add:

```
DATABASE_URL
postgresql://trefstays_user:GZDT34HeX7aHIcnYlDHPwr5mZJoXxDjQ@dpg-d61nnksoud1c73agi30g-a.oregon-postgres.render.com/trefstays

JWT_SECRET
ada7432c13ab55661d8bcd567a1e7e02dae9da7d9f2e7fb1a3d751e631cb9719e2bf455b21e43b11075f9cb571606acb8de0bd2bd0abcfa6d4c96dbd461bce4d

UPLOAD_DIR
/data/uploads

NODE_ENV
production

VITE_SUPABASE_URL
https://vprxeabfsxmxmkihxvxn.supabase.co

VITE_SUPABASE_PUBLISHABLE_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwcnhlYWJmc3hteG1raWh4dnhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMTEyMjksImV4cCI6MjA4NTc4NzIyOX0.9-wdaoUHbtpzzsTBlXgDTThICjovdGXg-d4aVIvmOPs
```

### Step 5: Mount Persistent Disk

1. Scroll down to **Disk** section
2. Click **Add Disk**
3. Select: `tref-stays-uploads` (the disk you created in Step 2)
4. **Mount Path:** `/data`
5. Click **Save**

**Important:** The mount path `/data` combined with `UPLOAD_DIR=/data/uploads` means images will be stored at `/data/uploads` on the persistent disk.

### Step 6: Deploy!

1. Review all settings
2. Click **Create Web Service**
3. Render will:
   - Clone your repository
   - Install dependencies (`npm install`)
   - Build your frontend (`npm run build`)
   - Start your server (`npm start`)
   - Mount the persistent disk at `/data`

**Deployment time:** 5-10 minutes

### Step 7: Verify Deployment

Once deployed, your app will be at: `https://tref-stays.onrender.com`

Test these endpoints:
- **Homepage:** https://tref-stays.onrender.com
- **Health Check:** https://tref-stays.onrender.com/api/health
- **Properties:** https://tref-stays.onrender.com/api/properties

## How It Works

### Image Upload Flow

1. User uploads images through the frontend
2. Images are sent to `/api/upload/images` endpoint
3. Multer saves images to `/data/uploads` (Persistent Disk)
4. Server returns URLs like `/uploads/1738854123456-789456.jpg`
5. Images are served via: `https://tref-stays.onrender.com/uploads/1738854123456-789456.jpg`

### Storage Details

- **Local Development:** Images stored in `public/uploads/`
- **Render Production:** Images stored in `/data/uploads/` (Persistent Disk)
- **Persistence:** Images survive redeploys because they're on Persistent Disk
- **URL Format:** `/uploads/filename.jpg`
- **Access:** Publicly accessible via HTTPS

## Monitoring

### View Logs
1. Go to Render Dashboard → `tref-stays` → **Logs**
2. Real-time logs show:
   - Server startup
   - Upload directory location
   - Image uploads
   - API requests

### Check Disk Usage
1. Go to Render Dashboard → Disks → `tref-stays-uploads`
2. View storage usage statistics

## Troubleshooting

### If images don't upload:
1. Check logs for errors
2. Verify `/data` is mounted correctly
3. Verify `UPLOAD_DIR=/data/uploads` environment variable

### If images return 404:
1. Check disk is mounted at `/data`
2. Verify images exist in persistent disk
3. Check static serving configuration

### If build fails:
1. Check build logs
2. Verify Node version compatibility
3. Ensure all dependencies are in package.json

## Updating Your App

```bash
git add .
git commit -m "Your update message"
git push origin main
```

Render will automatically:
- Rebuild your app
- Redeploy
- **Keep all images** (they're on Persistent Disk)

## Cost Estimate (Paid Plan)

- **Web Service:** $7/month (Standard plan)
- **PostgreSQL Database:** Already have on Render ($7/month)
- **Persistent Disk:** $1/month per GB (10GB = $10/month)
- **Total:** ~$17/month

## Benefits of This Setup

✅ Frontend + Backend in one service
✅ Images persist across deployments
✅ Free HTTPS/SSL
✅ Automatic builds on git push
✅ No vendor lock-in
✅ Full disk access
✅ Better performance than serverless for uploads

---

## 🚀 Ready to Deploy!

Your project is fully configured. Just follow the steps above to deploy to Render with Persistent Disk storage.
