import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    const jobs = await db.job.findMany({
      where: clientId ? { clientId } : {},
      include: {
        client: {
          select: {
            id: true,
            name: true,
            rating: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json(jobs)
  } catch (error) {
    console.error('Error fetching jobs:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Failed to fetch jobs'
    if (error instanceof Error) {
      if (error.message.includes('Can\'t reach database server')) {
        errorMessage = 'Database connection failed. Please check your DATABASE_URL in .env file and ensure your Supabase database is accessible.'
      } else if (error.message.includes('Invalid `prisma.job.findMany()`')) {
        errorMessage = 'Database operation failed. Please check your database configuration.'
      } else {
        errorMessage = `Failed to fetch jobs: ${error.message}`
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, date, price, notes, status } = body

    if (!clientId || !date || price === undefined) {
      return NextResponse.json(
        { error: 'Client ID, date, and price are required' },
        { status: 400 }
      )
    }

    // Check if client exists
    const client = await db.client.findUnique({
      where: { id: clientId }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    const job = await db.job.create({
      data: {
        clientId,
        date: new Date(date),
        price: parseFloat(price),
        notes,
        status: status || 'completed'
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            rating: true
          }
        }
      }
    })

    return NextResponse.json(job)
  } catch (error) {
    console.error('Error creating job:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create job'
    if (error instanceof Error) {
      if (error.message.includes('Can\'t reach database server')) {
        errorMessage = 'Database connection failed. Please check your DATABASE_URL in .env file and ensure your Supabase database is accessible.'
      } else if (error.message.includes('Invalid `prisma.job.create()`')) {
        errorMessage = 'Database operation failed. Please check your database configuration.'
      } else {
        errorMessage = `Failed to create job: ${error.message}`
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}