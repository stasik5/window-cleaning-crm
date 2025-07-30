import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await db.client.findUnique({
      where: { id: params.id },
      include: {
        jobs: {
          orderBy: { date: 'desc' }
        }
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Transform to match the expected format
    const clientWithLastJob = {
      ...client,
      lastJob: client.jobs[0] ? {
        date: client.jobs[0].date,
        price: client.jobs[0].price
      } : undefined,
      jobs: client.jobs
    }

    return NextResponse.json(clientWithLastJob)
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, email, phone, address, notes, rating } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const client = await db.client.update({
      where: { id: params.id },
      data: {
        name,
        email,
        phone,
        address,
        notes,
        rating: rating || 0
      },
      include: {
        jobs: {
          orderBy: { date: 'desc' }
        }
      }
    })

    // Transform to match the expected format
    const clientWithLastJob = {
      ...client,
      lastJob: client.jobs[0] ? {
        date: client.jobs[0].date,
        price: client.jobs[0].price
      } : undefined,
      jobs: client.jobs
    }

    return NextResponse.json(clientWithLastJob)
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.client.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    )
  }
}