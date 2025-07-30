# 🚀 Deployment Guide: Window Cleaning CRM to Vercel with Supabase

This guide will walk you through deploying your Window Cleaning CRM to Vercel with Supabase as the database.

## 📋 Prerequisites

Before you begin, make sure you have:

1. **Node.js 18+** installed on your local machine
2. **Git** installed and configured
3. **GitHub account** (or GitLab/Bitbucket)
4. **Supabase account** with a project created
5. **Vercel account** connected to your Git provider

## 🗄️ Step 1: Set Up Supabase

### Create a Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Enter your project details:
   - **Project Name**: `window-cleaning-crm` (or your preferred name)
   - **Database Password**: Create a strong password
   - **Region**: Choose the region closest to your users
4. Click "Create new project"

### Get Your Supabase Credentials

Once your project is created:

1. Go to **Project Settings** → **Database**
2. Find your **Connection string** under **Connection parameters**
3. Copy the **URI** connection string (it should look like `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres`)

4. Go to **Project Settings** → **API**
5. Copy your **Project URL** and **anon** public key under **Project API keys**

## 🔧 Step 2: Configure Environment Variables

### Local Development

1. Copy the environment template:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` with your Supabase credentials:
   ```env
   # Replace with your actual Supabase connection string
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres?sslmode=require"
   
   # Replace with your Supabase project details
   NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-ID].supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   ```

### Set Up Database

1. Install dependencies:
   ```bash
   npm install
   ```

2. Generate Prisma client:
   ```bash
   npm run db:generate
   ```

3. Push the database schema to Supabase:
   ```bash
   npm run db:push
   ```

4. Test locally:
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to ensure everything works correctly.

## 🚀 Step 3: Deploy to Vercel

### Push to Git Repository

1. Initialize git (if not already done):
   ```bash
   git init
   ```

2. Create a `.gitignore` file (if not present):
   ```
   # Dependencies
   node_modules/
   .pnp
   .pnp.js

   # Testing
   coverage/

   # Production
   build/
   dist/

   # Environment variables
   .env
   .env.local
   .env.development.local
   .env.test.local
   .env.production.local

   # Vercel
   .vercel

   # TypeScript
   *.tsbuildinfo

   # IDE
   .vscode/
   .idea/

   # OS
   .DS_Store
   Thumbs.db
   ```

3. Add and commit your code:
   ```bash
   git add .
   git commit -m "Initial commit: Window Cleaning CRM"
   ```

4. Create a repository on GitHub and push your code:
   ```bash
   git remote add origin https://github.com/your-username/window-cleaning-crm.git
   git branch -M main
   git push -u origin main
   ```

### Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"New Project"**
3. Select your Git repository (GitHub, GitLab, or Bitbucket)
4. Configure your project:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

5. **Add Environment Variables**:
   - Go to the **Environment Variables** tab
   - Add the following variables:
     - `DATABASE_URL`: Your Supabase connection string
     - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - Make sure to check **"Include Vercel Environment Variables"** for all environments

6. Click **"Deploy"**

## ✅ Step 4: Post-Deployment Checks

### Verify the Deployment

1. Once deployment is complete, visit your Vercel URL
2. Test all features:
   - Add a new client
   - Create a job
   - View the calendar
   - Search and filter clients
   - Generate an invoice

### Monitor Your Application

1. **Vercel Analytics**: Check your application's performance in the Vercel dashboard
2. **Supabase Logs**: Monitor your database queries and performance in the Supabase dashboard
3. **Error Tracking**: Set up error monitoring (consider integrating with Sentry or similar services)

## 🔒 Security Considerations

### Environment Variables

- Never commit your `.env.local` file to version control
- Use Vercel's environment variables for production secrets
- Regularly rotate your Supabase keys if needed

### Database Security

1. **Row Level Security (RLS)**: Consider enabling RLS in Supabase for additional security
2. **Backup**: Supabase automatically backs up your database, but verify your backup settings
3. **Connection Pooling**: For high-traffic applications, consider using Supabase's connection pooling

## 🔄 Step 5: Maintenance and Updates

### Updating the Application

1. Make changes to your local code
2. Test thoroughly:
   ```bash
   npm run dev
   ```
3. Commit and push to your main branch:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```
4. Vercel will automatically deploy your changes

### Database Schema Changes

If you need to make changes to your database schema:

1. Update your `prisma/schema.prisma` file
2. Generate the Prisma client:
   ```bash
   npm run db:generate
   ```
3. Push changes to Supabase:
   ```bash
   npm run db:push
   ```
4. Test locally, then commit and deploy

## 🆘 Troubleshooting

### Common Issues

**Build Errors on Vercel**
- Check that all environment variables are correctly set in Vercel
- Ensure your `package.json` scripts are correct
- Check the Vercel build logs for specific error messages

**Database Connection Issues**
- Verify your `DATABASE_URL` is correct
- Ensure SSL mode is enabled (`sslmode=require`)
- Check that your Supabase project is active

**API Routes Not Working**
- Verify your API routes are in the correct directory structure (`src/app/api/`)
- Check that your database connection is working
- Review the Vercel function logs

### Getting Help

1. **Vercel Documentation**: [https://vercel.com/docs](https://vercel.com/docs)
2. **Supabase Documentation**: [https://supabase.com/docs](https://supabase.com/docs)
3. **Next.js Documentation**: [https://nextjs.org/docs](https://nextjs.org/docs)
4. **Prisma Documentation**: [https://www.prisma.io/docs](https://www.prisma.io/docs)

## 🎉 Success!

Your Window Cleaning CRM is now deployed to Vercel with Supabase as the database! You can now:

- ✅ Manage clients and jobs from anywhere
- ✅ Access your data securely through the Supabase dashboard
- ✅ Enjoy automatic deployments with Vercel
- ✅ Scale your application as needed

Remember to regularly update your application and monitor its performance for the best results.

---

**Happy cleaning! 🪟✨**