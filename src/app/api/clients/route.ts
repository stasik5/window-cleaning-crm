import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('search') || ''
    const ratingFilter = searchParams.get('rating') || 'all'
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    let clients = await db.client.findMany({
      include: {
        jobs: {
          orderBy: { date: 'desc' }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Filter by search term
    if (searchTerm) {
      clients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.includes(searchTerm) ||
        client.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.jobs?.some(job => 
          job.notes?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Filter by rating
    if (ratingFilter !== 'all') {
      const minRating = parseInt(ratingFilter)
      clients = clients.filter(client => client.rating >= minRating)
    }

    // Sort clients
    clients.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'rating':
          comparison = a.rating - b.rating
          break
        case 'price':
          const aPrice = a.jobs[0]?.price || 0
          const bPrice = b.jobs[0]?.price || 0
          comparison = aPrice - bPrice
          break
        case 'date':
          const aDate = a.jobs[0]?.date ? new Date(a.jobs[0].date).getTime() : 0
          const bDate = b.jobs[0]?.date ? new Date(b.jobs[0].date).getTime() : 0
          comparison = aDate - bDate
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

    // Transform to match the expected format
    const clientsWithLastJob = clients.map(client => {
      const lastJob = client.jobs[0]
      return {
        ...client,
        lastJob: lastJob ? {
          date: lastJob.date,
          price: lastJob.price
        } : undefined,
        jobs: client.jobs
      }
    })

    return NextResponse.json(clientsWithLastJob)
  } catch (error) {
    console.error('Error fetching clients:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Failed to fetch clients'
    if (error instanceof Error) {
      if (error.message.includes('Can\'t reach database server')) {
        errorMessage = 'Database connection failed. Please check your DATABASE_URL in .env file and ensure your Supabase database is accessible.'
      } else if (error.message.includes('Invalid `prisma.client.findMany()`')) {
        errorMessage = 'Database operation failed. Please check your database configuration.'
      } else {
        errorMessage = `Failed to fetch clients: ${error.message}`
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
    const { name, email, phone, address, notes, rating } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const client = await db.client.create({
      data: {
        name,
        email,
        phone,
        address,
        notes,
        rating: rating || 0
      },
      include: {
        jobs: true
      }
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error creating client:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create client'
    if (error instanceof Error) {
      if (error.message.includes('Can\'t reach database server')) {
        errorMessage = 'Database connection failed. Please check your DATABASE_URL in .env file and ensure your Supabase database is accessible.'
      } else if (error.message.includes('Invalid `prisma.client.create()`')) {
        errorMessage = 'Database operation failed. Please check your database configuration.'
      } else {
        errorMessage = `Failed to create client: ${error.message}`
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}