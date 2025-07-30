# 🪟 Window Cleaning CRM

A modern, production-ready Window Cleaning Customer Relationship Management (CRM) application built with Next.js 15, TypeScript, and Supabase.

## ✨ Features

- **👥 Client Management** - Add, edit, delete, and organize clients with detailed information
- **📅 Job Scheduling** - Schedule and track cleaning jobs with calendar view
- **💰 Pricing & Invoicing** - Track job prices and generate invoices
- **⭐ Rating System** - Rate clients and filter by ratings
- **🔍 Search & Filter** - Powerful search and filtering capabilities
- **📊 Dashboard** - Comprehensive dashboard with client cards and job history
- **📅 Calendar View** - Monthly calendar with job scheduling
- **🎨 Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **🗄️ Cloud Database** - Powered by Supabase for reliable data storage

## 🚀 Technology Stack

### Core Framework
- **⚡ Next.js 15** - React framework with App Router
- **📘 TypeScript 5** - Type-safe development
- **🎨 Tailwind CSS 4** - Utility-first CSS framework

### Database & Backend
- **🗄️ Supabase** - PostgreSQL database with real-time capabilities
- **🔮 Prisma** - Next-generation ORM for database operations
- **🌐 REST API** - Custom API routes for CRUD operations

### UI Components
- **🧩 shadcn/ui** - High-quality, accessible components
- **🎯 Lucide React** - Beautiful icon library
- **🎨 Framer Motion** - Smooth animations and transitions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Supabase account and project created
- Vercel account for deployment

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd window-cleaning-crm

# Install dependencies
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Copy the example environment file
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
# Supabase Database URL
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres?sslmode=require"

# Optional: Supabase Service Role Key (for server-side operations)
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-ID].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

### 3. Set Up Database

```bash
# Generate Prisma client
npm run db:generate

# Push the schema to your Supabase database
npm run db:push
```

### 4. Run the Development Server

```bash
# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your CRM application running.

## 🚀 Deployment to Vercel

### 1. Connect Your Repository

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project" and connect your repository

### 2. Configure Environment Variables

In your Vercel project settings:

1. Go to "Settings" → "Environment Variables"
2. Add the following variables:
   - `DATABASE_URL`: Your Supabase connection string
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### 3. Deploy

1. Click "Deploy" in Vercel
2. Vercel will automatically build and deploy your application
3. Once deployed, your CRM will be available at your Vercel URL

### 4. Set Up Database on Vercel

Since you're using Supabase, your database is already hosted and ready. No additional database setup is needed on Vercel.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── clients/       # Client CRUD operations
│   │   └── jobs/          # Job CRUD operations
│   ├── page.tsx           # Main CRM application
│   └── layout.tsx         # Root layout
├── components/            # Reusable React components
│   └── ui/               # shadcn/ui components
├── hooks/                # Custom React hooks
└── lib/                  # Utility functions
    ├── db.ts             # Database connection
    ├── dataPersistence.ts # Data persistence utilities
    └── utils.ts          # Helper functions
prisma/
└── schema.prisma        # Database schema
```

## 🗄️ Database Schema

The application uses two main tables:

### Clients
- `id` - Unique identifier
- `name` - Client name (required)
- `email` - Email address (optional)
- `phone` - Phone number (optional)
- `address` - Property address (optional)
- `notes` - Special instructions or notes (optional)
- `rating` - Client rating (0-5 stars)
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

### Jobs
- `id` - Unique identifier
- `clientId` - Reference to client (foreign key)
- `date` - Job date
- `price` - Job price
- `notes` - Job notes (optional)
- `status` - Job status (completed, scheduled, cancelled)

## 🔧 API Routes

### Clients
- `GET /api/clients` - Get all clients with filtering and sorting
- `POST /api/clients` - Create a new client
- `GET /api/clients/[id]` - Get a specific client
- `PUT /api/clients/[id]` - Update a client
- `DELETE /api/clients/[id]` - Delete a client

### Jobs
- `GET /api/jobs` - Get all jobs (optionally filtered by client)
- `POST /api/jobs` - Create a new job
- `GET /api/jobs/[id]` - Get a specific job
- `PUT /api/jobs/[id]` - Update a job
- `DELETE /api/jobs/[id]` - Delete a job

## 🎨 Features in Detail

### Client Management
- Add new clients with contact information
- Edit client details
- Delete clients (with confirmation)
- Rate clients with 1-5 stars
- Add notes and special instructions

### Job Management
- Schedule jobs for specific dates
- Track job status (completed, scheduled, cancelled)
- Add job notes and pricing
- View job history for each client
- Delete jobs when needed

### Calendar View
- Monthly calendar showing all scheduled jobs
- Color-coded job statuses
- Click-to-add jobs on specific dates
- View job details by clicking on calendar entries

### Dashboard
- Client cards with color-coded priority
- Search clients by name, email, phone, or notes
- Filter clients by rating
- Sort clients by name, rating, last price, or last date
- Quick actions for each client (edit, add job, view history, generate invoice)

### Search & Filtering
- Real-time search across all client data
- Filter by client rating
- Sort by multiple criteria
- Responsive search interface

## 🌟 Getting Help

If you need help with setup or have questions:

1. Check the [Supabase Documentation](https://supabase.com/docs)
2. Review the [Vercel Deployment Guide](https://vercel.com/docs)
3. Refer to the [Next.js Documentation](https://nextjs.org/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ for window cleaning businesses. Powered by Next.js and Supabase. 🚀
