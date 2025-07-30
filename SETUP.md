# Window Cleaning CRM - Setup Guide

## Quick Start

### Prerequisites
- Node.js 18+ installed
- A Supabase account (free tier available)
- Basic knowledge of command line

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Database

#### Option A: Supabase (Recommended for Production)
1. **Create a Supabase Project:**
   - Go to [https://supabase.com](https://supabase.com)
   - Sign up and create a new project
   - Wait for the database to be provisioned (2-3 minutes)

2. **Get Your Database Credentials:**
   - Go to your Supabase project dashboard
   - Navigate to **Settings** → **Database**
   - Find the **Connection string** section
   - Copy the **URI** connection string

3. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```
   - Edit `.env` file
   - Replace the placeholder `DATABASE_URL` with your actual Supabase connection string
   - Example: `postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_ID.supabase.co:5432/postgres?sslmode=require`

4. **Set Up Database Schema:**
   ```bash
   npm run db:push
   ```

#### Option B: SQLite (For Development Only)
If you want to test the application without setting up Supabase:

1. **Create a local SQLite database:**
   ```bash
   # Create a local database file
   touch dev.db
   
   # Update your .env file to use SQLite:
   DATABASE_URL="file:./dev.db"
   ```

2. **Set Up Database Schema:**
   ```bash
   npm run db:push
   ```

### Step 3: Start the Development Server
```bash
npm run dev
```

### Step 4: Access the Application
Open your browser and go to: [http://localhost:3000](http://localhost:3000)

## Troubleshooting

### "Failed to create client" Error
This error typically means your database connection is not working properly.

#### Check Database Connection:
1. **Verify your DATABASE_URL:**
   - Make sure it doesn't contain placeholder values like `your_password` or `your-project-id`
   - Check that you copied the exact connection string from Supabase

2. **Test Database Status:**
   - Open [http://localhost:3000/api/db-status](http://localhost:3000/api/db-status) in your browser
   - This will show you detailed information about your database connection

3. **Common Issues:**
   - **Placeholder values in .env**: Replace `your_actual_password` and `your-project-id` with real values
   - **Wrong password**: Double-check your database password from Supabase settings
   - **Project not active**: Ensure your Supabase project is active and not paused
   - **Network issues**: Make sure you can access the Supabase dashboard

### Database Connection Errors in Logs
If you see errors like:
```
Can't reach database server at `db.your-project-id.supabase.co:5432`
```

This means your DATABASE_URL still contains placeholder values. Check your `.env` file and replace the placeholders with actual Supabase credentials.

### Application Shows "Database Disconnected"
The application will show a red warning banner when the database is not connected. This is normal if:
- You haven't configured your DATABASE_URL yet
- Your Supabase project is not accessible
- There are network connectivity issues

Follow the setup steps above to resolve this.

## Features

### Client Management
- Add, edit, and delete clients
- Search and filter clients
- Client contact information
- Rating system (1-5 stars)

### Job Management
- Schedule jobs for clients
- Track job status (completed, scheduled, cancelled)
- Job pricing and notes
- Job history for each client

### Calendar View
- Visual calendar showing all scheduled jobs
- Add jobs directly from the calendar
- Color-coded job status indicators
- Navigate between months

### Dashboard
- Overview of all clients
- Quick access to recent jobs
- Client statistics and insights

## Deployment to Vercel

### Prerequisites
- GitHub repository with your code
- Vercel account
- Supabase project configured

### Steps:
1. **Push your code to GitHub**
2. **Connect to Vercel:**
   - Import your GitHub repository in Vercel
   - Vercel will automatically detect it as a Next.js app

3. **Configure Environment Variables in Vercel:**
   - Go to your Vercel project settings
   - Add the same `DATABASE_URL` from your `.env` file
   - Add any other environment variables you're using

4. **Deploy:**
   - Vercel will automatically deploy your application
   - Your app will be available at a `.vercel.app` domain

### Important Notes for Deployment:
- Make sure your DATABASE_URL points to your production Supabase database
- Do not use SQLite for production deployments
- Ensure your Supabase project allows connections from Vercel's IP addresses

## Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify your database connection using the `/api/db-status` endpoint
3. Ensure all environment variables are properly set
4. Check the browser console for any JavaScript errors

## Development

### Project Structure
```
src/
├── app/
│   ├── api/          # API routes
│   │   ├── clients/  # Client CRUD operations
│   │   ├── jobs/     # Job CRUD operations
│   │   └── db-status/ # Database status check
│   └── page.tsx      # Main application component
├── components/
│   └── ui/           # shadcn/ui components
└── lib/
    ├── db.ts         # Database configuration
    ├── db-config.ts  # Database configuration helper
    └── use-toast.ts  # Toast notifications
```

### Database Schema
The application uses two main tables:
- `clients`: Stores client information
- `jobs`: Stores job records linked to clients

### API Endpoints
- `GET /api/clients` - Fetch all clients with filtering and sorting
- `POST /api/clients` - Create a new client
- `GET /api/clients/[id]` - Get a specific client
- `PUT /api/clients/[id]` - Update a client
- `DELETE /api/clients/[id]` - Delete a client
- `GET /api/jobs` - Fetch all jobs
- `POST /api/jobs` - Create a new job
- `GET /api/db-status` - Check database connection status