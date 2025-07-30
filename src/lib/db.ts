import { DatabaseConfig } from './db-config'

// Export the configured database instance
export const db = DatabaseConfig.getInstance()

// Export configuration helpers for debugging
export { DatabaseConfig }