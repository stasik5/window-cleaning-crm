interface Job {
  id: string
  clientId: string
  date: Date
  price: number
  notes?: string
  status: string
}

interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  rating: number
  createdAt: Date
  updatedAt: Date
}

interface BackupData {
  clients: Client[]
  jobs: Job[]
  backupDate: Date
}

export class DataPersistence {
  private static readonly STORAGE_KEY = 'window_cleaning_crm_data'
  private static readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024 // 5MB

  static loadData(): { clients: Client[]; jobs: Job[] } | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      if (!data) return null

      const parsed = JSON.parse(data)
      
      // Convert date strings back to Date objects
      const clients = parsed.clients.map((client: any) => ({
        ...client,
        createdAt: new Date(client.createdAt),
        updatedAt: new Date(client.updatedAt)
      }))
      
      const jobs = parsed.jobs.map((job: any) => ({
        ...job,
        date: new Date(job.date)
      }))

      return { clients, jobs }
    } catch (error) {
      console.error('Error loading data from localStorage:', error)
      return null
    }
  }

  static saveData(clients: Client[], jobs: Job[]): void {
    try {
      const data = {
        clients,
        jobs,
        lastSaved: new Date().toISOString()
      }

      const jsonData = JSON.stringify(data)
      
      // Check storage size
      if (jsonData.length > this.MAX_STORAGE_SIZE) {
        throw new Error('Data exceeds maximum storage size')
      }

      localStorage.setItem(this.STORAGE_KEY, jsonData)
    } catch (error) {
      console.error('Error saving data to localStorage:', error)
      throw error
    }
  }

  static getStorageInfo(): { used: number; total: number; lastBackup?: Date } {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      const used = data ? new Blob([data]).size : 0
      
      // Get last backup date from metadata
      let lastBackup: Date | undefined
      if (data) {
        try {
          const parsed = JSON.parse(data)
          if (parsed.lastSaved) {
            lastBackup = new Date(parsed.lastSaved)
          }
        } catch {
          // Ignore parse errors for metadata
        }
      }

      return {
        used,
        total: this.MAX_STORAGE_SIZE,
        lastBackup
      }
    } catch (error) {
      console.error('Error getting storage info:', error)
      return {
        used: 0,
        total: this.MAX_STORAGE_SIZE
      }
    }
  }

  static downloadBackup(clients: Client[], jobs: Job[]): void {
    try {
      const backupData: BackupData = {
        clients,
        jobs,
        backupDate: new Date()
      }

      const jsonData = JSON.stringify(backupData, null, 2)
      const blob = new Blob([jsonData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `window-cleaning-crm-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading backup:', error)
      throw error
    }
  }

  static async importBackup(file: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (event) => {
        try {
          const jsonData = event.target?.result as string
          const backupData = JSON.parse(jsonData)
          
          // Validate backup data structure
          if (!backupData.clients || !backupData.jobs || !backupData.backupDate) {
            throw new Error('Invalid backup file format')
          }

          // Convert date strings back to Date objects
          backupData.clients = backupData.clients.map((client: any) => ({
            ...client,
            createdAt: new Date(client.createdAt),
            updatedAt: new Date(client.updatedAt)
          }))
          
          backupData.jobs = backupData.jobs.map((job: any) => ({
            ...job,
            date: new Date(job.date)
          }))
          
          backupData.backupDate = new Date(backupData.backupDate)
          
          resolve(backupData)
        } catch (error) {
          reject(new Error(`Failed to parse backup file: ${error instanceof Error ? error.message : 'Unknown error'}`))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('Failed to read backup file'))
      }
      
      reader.readAsText(file)
    })
  }

  static clearData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      console.error('Error clearing data:', error)
      throw error
    }
  }
}