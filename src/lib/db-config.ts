import { PrismaClient } from '@prisma/client'

// Database configuration helper
export class DatabaseConfig {
  private static instance: PrismaClient
  private static isConfigured = false

  static getInstance(): PrismaClient {
    if (!DatabaseConfig.instance) {
      const globalForPrisma = globalThis as unknown as {
        prisma: PrismaClient | undefined
      }

      DatabaseConfig.instance = globalForPrisma.prisma ?? new PrismaClient({
        log: ['query'],
      })

      if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.prisma = DatabaseConfig.instance
      }
    }
    return DatabaseConfig.instance
  }

  static checkConfiguration(): { isValid: boolean; message: string } {
    const databaseUrl = process.env.DATABASE_URL

    if (!databaseUrl) {
      return {
        isValid: false,
        message: 'DATABASE_URL environment variable is not set. Please configure your database connection in the .env file.'
      }
    }

    if (databaseUrl.includes('your-project-id') || databaseUrl.includes('your_password')) {
      return {
        isValid: false,
        message: 'DATABASE_URL contains placeholder values. Please replace with your actual Supabase database credentials.'
      }
    }

    if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
      return {
        isValid: false,
        message: 'DATABASE_URL must start with "postgresql://" or "postgres://". Please check your database connection string.'
      }
    }

    return { isValid: true, message: 'Database configuration is valid.' }
  }

  static getDatabaseInfo(): {
    provider: string
    url: string
    isConfigured: boolean
    message?: string
  } {
    const databaseUrl = process.env.DATABASE_URL || ''
    const configCheck = this.checkConfiguration()

    return {
      provider: databaseUrl.startsWith('sqlite') ? 'SQLite' : 'PostgreSQL',
      url: databaseUrl.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'), // Hide credentials
      isConfigured: configCheck.isValid,
      message: configCheck.isValid ? undefined : configCheck.message
    }
  }
}

// Export the database instance
export const db = DatabaseConfig.getInstance()