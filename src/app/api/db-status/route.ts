import { NextResponse } from 'next/server'
import { DatabaseConfig } from '@/lib/db-config'

export async function GET() {
  try {
    const configCheck = DatabaseConfig.checkConfiguration()
    const dbInfo = DatabaseConfig.getDatabaseInfo()

    // Try to connect to the database if configuration looks valid
    let connectionStatus = 'not_tested'
    let connectionError = null

    if (configCheck.isValid) {
      try {
        await DatabaseConfig.getInstance().$connect()
        await DatabaseConfig.getInstance().$disconnect()
        connectionStatus = 'connected'
      } catch (error) {
        connectionStatus = 'failed'
        connectionError = error instanceof Error ? error.message : 'Unknown error'
      }
    }

    return NextResponse.json({
      configuration: {
        isValid: configCheck.isValid,
        message: configCheck.message
      },
      database: dbInfo,
      connection: {
        status: connectionStatus,
        error: connectionError
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlPreview: process.env.DATABASE_URL ? 
          process.env.DATABASE_URL.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@') : 
          null
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check database status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}