"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import * as jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Star, MapPin, Phone, Mail, Edit, Trash2, Calendar, DollarSign, History, FileText, ArrowUpDown, X, Download, Upload, Database, AlertCircle, LogOut, ChevronDown, Settings } from "lucide-react"
import { Client } from "@prisma/client"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
interface ClientWithLastJob extends Client {
  lastJob?: {
    date: Date
    price: number
  }
  jobs?: Array<{
    id: string
    date: Date
    price: number
    notes?: string
    status: string
  }>
}
interface CalendarViewProps {
  clients: ClientWithLastJob[]
  onClientClick: (client: ClientWithLastJob) => void
  onClientSelectForJob: (date: Date, clientId: string) => void
  onAddJob: (date: Date, clientId: string, jobData: { price: string; notes: string; status: string }) => void
}
function CalendarView({ clients, onClientClick, onClientSelectForJob, onAddJob }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isAddJobDialogOpen, setIsAddJobDialogOpen] = useState(false)
  const [isClientDetailOpen, setIsClientDetailOpen] = useState(false)
  const [selectedClientForDetail, setSelectedClientForDetail] = useState<ClientWithLastJob | null>(null)
  const [selectedDateForJob, setSelectedDateForJob] = useState<Date | null>(null)
  const [selectedClientForJob, setSelectedClientForJob] = useState<ClientWithLastJob | null>(null)
  const [clientSearchTerm, setClientSearchTerm] = useState("")
  const [filteredClientsForJob, setFilteredClientsForJob] = useState<ClientWithLastJob[]>([])
  const [isJobFormOpen, setIsJobFormOpen] = useState(false)
  const [newJob, setNewJob] = useState({
    date: "",
    price: "",
    notes: "",
    status: "completed"
  })
  
  // Handle client click within calendar view
  const handleClientClick = (client: ClientWithLastJob) => {
    setSelectedClientForDetail(client)
    setIsClientDetailOpen(true)
  }
  
  // Filter clients based on search term (prioritize phone number)
  useEffect(() => {
    if (!clientSearchTerm) {
      setFilteredClientsForJob(clients)
      return
    }
    
    const filtered = clients.filter(client =>
      client.phone?.includes(clientSearchTerm) ||
      client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(clientSearchTerm.toLowerCase())
    )
    
    // Sort by phone number match first, then name
    filtered.sort((a, b) => {
      const aPhoneMatch = a.phone?.includes(clientSearchTerm) || false
      const bPhoneMatch = b.phone?.includes(clientSearchTerm) || false
      
      if (aPhoneMatch && !bPhoneMatch) return -1
      if (!aPhoneMatch && bPhoneMatch) return 1
      
      return a.name.localeCompare(b.name)
    })
    
    setFilteredClientsForJob(filtered)
  }, [clientSearchTerm, clients])
  
  // Get all jobs from all clients and group by date
  const allJobs = clients.flatMap(client => 
    client.jobs?.map(job => ({
      ...job,
      clientName: client.name,
      clientId: client.id,
      clientRating: client.rating
    })) || []
  )
  
  // Group jobs by date
  const jobsByDate = allJobs.reduce((acc, job) => {
    const dateKey = new Date(job.date).toDateString()
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(job)
    return acc
  }, {} as Record<string, typeof allJobs>)
  
  // Get dates for the current month
  const getMonthDates = (date: Date): (Date | null)[] => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const dates: (Date | null)[] = []
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay.getDay(); i++) {
      dates.push(null)
    }
    
    // Add days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      dates.push(new Date(year, month, i))
    }
    
    return dates
  }
  
  const monthDates = getMonthDates(selectedDate)
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    newDate.setMonth(selectedDate.getMonth() + (direction === 'next' ? 1 : -1))
    setSelectedDate(newDate)
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-300'
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }
  
  const openAddJobDialog = (date: Date) => {
    setSelectedDateForJob(date)
    setClientSearchTerm("")
    setFilteredClientsForJob(clients)
    setIsAddJobDialogOpen(true)
  }
  
  const handleClientSelectForJob = (clientId: string) => {
    const selectedClient = clients.find(c => c.id === clientId)
    if (selectedClient && selectedDateForJob) {
      setSelectedClientForJob(selectedClient)
      setNewJob({
        date: selectedDateForJob.toISOString().split('T')[0],
        price: "",
        notes: "",
        status: "completed"
      })
      setIsJobFormOpen(true)
      setIsAddJobDialogOpen(false)
      setSelectedDateForJob(null)
    }
  }
  
  const handleJobSubmit = () => {
    if (selectedClientForJob && newJob.price) {
      onAddJob(new Date(newJob.date), selectedClientForJob.id, {
        price: newJob.price,
        notes: newJob.notes,
        status: newJob.status
      })
      setIsJobFormOpen(false)
      setSelectedClientForJob(null)
      setNewJob({
        date: "",
        price: "",
        notes: "",
        status: "completed"
      })
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Job Calendar</h2>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')} className="flex-1 sm:flex-none">
                Previous
              </Button>
              <div className="flex items-center gap-1 sm:gap-2 flex-1 sm:flex-none justify-center">
                <span className="font-medium text-sm sm:text-lg">{selectedDate.toLocaleDateString('en-US', { month: 'long' })}</span>
                <Select
                  value={selectedDate.getFullYear().toString()}
                  onValueChange={(value) => {
                    const newDate = new Date(selectedDate)
                    newDate.setFullYear(parseInt(value))
                    setSelectedDate(newDate)
                  }}
                >
                  <SelectTrigger className="w-[80px] sm:w-[100px] h-8 text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 21 }, (_, i) => {
                      const year = new Date().getFullYear() - 10 + i
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-1 sm:px-2 text-xs hidden sm:flex"
                  onClick={() => {
                    setSelectedDate(new Date())
                  }}
                  title="Go to today"
                >
                  Today
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')} className="flex-1 sm:flex-none">
                Next
              </Button>
            </div>
            {/* Mobile Today Button */}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full sm:hidden"
              onClick={() => {
                setSelectedDate(new Date())
              }}
            >
              Today
            </Button>
          </div>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-1 sm:p-3 text-center font-medium text-gray-700 border-b text-xs sm:text-sm">
            {day}
          </div>
        ))}
        
        {monthDates.map((date, index) => {
          const dateKey = date?.toDateString()
          const dayJobs = dateKey ? jobsByDate[dateKey] || [] : []
          const isToday = date && date.toDateString() === new Date().toDateString()
          
          return (
            <div
              key={index}
              className={`
                min-h-[80px] sm:min-h-[120px] p-1 sm:p-2 border border-gray-200 relative group
                ${date ? 'bg-white hover:bg-gray-50 cursor-pointer' : 'bg-gray-50'}
                ${isToday ? 'ring-1 sm:ring-2 ring-blue-500' : ''}
              `}
              onClick={() => date && setSelectedDate(date)}
            >
              {date && (
                <>
                  {/* Plus button for adding job - appears on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      openAddJobDialog(date)
                    }}
                    className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 
                             bg-blue-500 hover:bg-blue-600 text-white rounded-full p-0.5 sm:p-1 shadow-md
                             focus:opacity-100 focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-blue-400"
                    title="Add job for this date"
                  >
                    <Plus className="h-2 w-2 sm:h-3 sm:w-3" />
                  </button>
                  
                  <div className={`
                    text-xs sm:text-sm font-medium mb-1 pr-4 sm:pr-6
                    ${isToday ? 'text-blue-600' : 'text-gray-900'}
                  `}>
                    {date.getDate()}
                  </div>
                  
                  <div className="space-y-0.5 sm:space-y-1 max-h-[50px] sm:max-h-[80px] overflow-y-auto">
                    {dayJobs.map((job, jobIndex) => (
                      <div
                        key={jobIndex}
                        className={`
                          text-xs p-0.5 sm:p-1 rounded border cursor-pointer
                          ${getStatusColor(job.status)}
                          hover:opacity-80 transition-opacity
                        `}
                        onClick={(e) => {
                          e.stopPropagation()
                          const client = clients.find(c => c.id === job.clientId)
                          if (client) handleClientClick(client)
                        }}
                        title={`${job.clientName} - $${job.price}`}
                      >
                        <div className="font-medium truncate text-xs">{job.clientName}</div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs">${job.price}</span>
                          <div className="flex">
                            {Array.from({ length: Math.min(job.clientRating, 3) }, (_, i) => (
                              <Star key={i} className="h-1.5 w-1.5 sm:h-2 sm:w-2 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Selected Date Details */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Jobs for {selectedDate.toLocaleDateString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {jobsByDate[selectedDate.toDateString()]?.length > 0 ? (
              <div className="space-y-3">
                {jobsByDate[selectedDate.toDateString()].map((job, index) => {
                  const client = clients.find(c => c.id === job.clientId)
                  return (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium">{job.clientName}</div>
                          <div className="text-sm text-gray-600">{client?.phone || 'No phone'}</div>
                          {job.notes && (
                            <div className="text-sm text-gray-500 mt-1">{job.notes}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-green-600">${job.price}</div>
                        <Badge variant={job.status === 'completed' ? 'default' : job.status === 'scheduled' ? 'secondary' : 'destructive'} className="mt-1">
                          {job.status}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No jobs scheduled for this date</p>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Add Job Dialog */}
      <Dialog open={isAddJobDialogOpen} onOpenChange={setIsAddJobDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Job for {selectedDateForJob?.toLocaleDateString()}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="client-search">Search Client (by phone or name)</Label>
              <Input
                id="client-search"
                placeholder="Enter phone number or name..."
                value={clientSearchTerm}
                onChange={(e) => setClientSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredClientsForJob.length > 0 ? (
                filteredClientsForJob.map((client) => (
                  <div
                    key={client.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleClientSelectForJob(client.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{client.name}</div>
                        <div className="text-sm text-gray-600">{client.phone}</div>
                        <div className="text-xs text-gray-500">{client.email}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(client.rating, 3) }, (_, i) => (
                          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No clients found</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Client Detail Dialog */}
      <Dialog open={isClientDetailOpen} onOpenChange={setIsClientDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span>Client Details</span>
                <div className="flex">
                  {Array.from({ length: Math.min(selectedClientForDetail?.rating || 0, 5) }, (_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedClientForDetail && (
            <div className="space-y-6">
              {/* Client Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Client Information
                    </span>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          onClientClick(selectedClientForDetail)
                          setIsClientDetailOpen(false)
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          onClientSelectForJob(new Date(), selectedClientForDetail.id)
                          setIsClientDetailOpen(false)
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Job
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Name</Label>
                      <p className="text-lg font-semibold">{selectedClientForDetail.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Phone</Label>
                      <p className="text-lg font-semibold flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {selectedClientForDetail.phone ? (
                          <a 
                            href={`tel:${selectedClientForDetail.phone.replace(/[^\d+]/g, '')}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200 active:text-blue-900"
                            onClick={(e) => {
                              // Add haptic feedback on mobile if available
                              if ('vibrate' in navigator) {
                                navigator.vibrate(50);
                              }
                            }}
                          >
                            {selectedClientForDetail.phone}
                          </a>
                        ) : (
                          <span className="text-gray-500">Not provided</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Email</Label>
                      <p className="text-lg font-semibold flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {selectedClientForDetail.email || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Address</Label>
                      <p className="text-lg font-semibold">{selectedClientForDetail.address || 'Not provided'}</p>
                    </div>
                  </div>
                  {selectedClientForDetail.notes && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Notes</Label>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedClientForDetail.notes}</p>
                    </div>
                  )}
                  {selectedClientForDetail.lastJob && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <Label className="text-sm font-medium text-blue-800">Last Service</Label>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-blue-900 font-medium">
                          {new Date(selectedClientForDetail.lastJob.date).toLocaleDateString()}
                        </span>
                        <span className="text-blue-900 font-bold text-lg">
                          ${selectedClientForDetail.lastJob.price}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              {/* Job History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Job History
                    <Badge variant="outline" className="ml-auto">
                      {selectedClientForDetail.jobs?.length || 0} jobs
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedClientForDetail.jobs && selectedClientForDetail.jobs.length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {selectedClientForDetail.jobs.map((job) => (
                        <Card key={job.id} className="p-4 border-l-4 border-l-blue-500">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">
                                {new Date(job.date).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="font-medium text-green-600">
                                ${job.price}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={job.status === 'completed' ? 'default' : job.status === 'scheduled' ? 'secondary' : 'destructive'}>
                              {job.status}
                            </Badge>
                          </div>
                          {job.notes && (
                            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                              {job.notes}
                            </p>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No job history found</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => {
                          onClientSelectForJob(new Date(), selectedClientForDetail.id)
                          setIsClientDetailOpen(false)
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add First Job
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              {/* Quick Actions */}
              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    onClientClick(selectedClientForDetail)
                    setIsClientDetailOpen(false)
                  }}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Generate Invoice
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this client?")) {
                      // This would need to be handled by the parent component
                      onClientClick(selectedClientForDetail)
                      setIsClientDetailOpen(false)
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Client
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Job Form Dialog */}
      <Dialog open={isJobFormOpen} onOpenChange={setIsJobFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Job for {selectedClientForJob?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="job-date">Date</Label>
              <Input
                id="job-date"
                type="date"
                value={newJob.date}
                onChange={(e) => setNewJob({ ...newJob, date: e.target.value })}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="job-price">Price ($)</Label>
              <Input
                id="job-price"
                type="number"
                placeholder="0.00"
                value={newJob.price}
                onChange={(e) => setNewJob({ ...newJob, price: e.target.value })}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="job-status">Status</Label>
              <Select value={newJob.status} onValueChange={(value) => setNewJob({ ...newJob, status: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="job-notes">Notes</Label>
              <Textarea
                id="job-notes"
                placeholder="Any additional notes..."
                value={newJob.notes}
                onChange={(e) => setNewJob({ ...newJob, notes: e.target.value })}
                className="mt-1"
                rows={3}
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={handleJobSubmit} className="flex-1">
                Save Job
              </Button>
              <Button variant="outline" onClick={() => setIsJobFormOpen(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default function WindowCleaningCRM() {
  const [dbStatus, setDbStatus] = useState<{
    isConnected: boolean
    message: string
    details?: any
  }>({ isConnected: false, message: 'Checking database connection...' })
  const [authLoading, setAuthLoading] = useState(true)
  const [clients, setClients] = useState<ClientWithLastJob[]>([])
  const [filteredClients, setFilteredClients] = useState<ClientWithLastJob[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [ratingFilter, setRatingFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"name" | "rating" | "price" | "date">("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false)
  const [isJobHistoryOpen, setIsJobHistoryOpen] = useState(false)
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false)
  const [isClientDetailOpen, setIsClientDetailOpen] = useState(false)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<ClientWithLastJob | null>(null)
  const [selectedClientForJob, setSelectedClientForJob] = useState<ClientWithLastJob | null>(null)
  const [selectedClientForHistory, setSelectedClientForHistory] = useState<ClientWithLastJob | null>(null)
  const [selectedClientForInvoice, setSelectedClientForInvoice] = useState<ClientWithLastJob | null>(null)
  const [selectedClientForDetail, setSelectedClientForDetail] = useState<ClientWithLastJob | null>(null)
  const [newJob, setNewJob] = useState({
    date: "",
    price: "",
    notes: "",
    status: "completed"
  })
  const [invoiceData, setInvoiceData] = useState({
    jobId: "",
    notes: "",
    logoUrl: "",
    serviceDescription: "",
    paymentDate: ""
  })
  const [invoiceLanguage, setInvoiceLanguage] = useState("en")
  const [companySettings, setCompanySettings] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    logoUrl: "",
    bankName: "",
    bankAccount: "",
    bankCode: "",
    defaultLanguage: "en",
    defaultServiceDescription: "Window Cleaning Services"
  })
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    rating: 0
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  const { user, signOut, loading: authStateLoading } = useAuth()
  const router = useRouter()

  // Fetch clients from API
  const checkDatabaseStatus = async () => {
    try {
      const response = await fetch('/api/db-status')
      const data = await response.json()
      
      if (data.configuration?.isValid && data.connection?.status === 'connected') {
        setDbStatus({
          isConnected: true,
          message: 'Database connected successfully',
          details: data
        })
      } else {
        setDbStatus({
          isConnected: false,
          message: data.configuration?.message || 'Database connection failed',
          details: data
        })
      }
    } catch (error) {
      setDbStatus({
        isConnected: false,
        message: 'Unable to check database status',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const fetchClients = async () => {
    if (!dbStatus.isConnected) {
      // Don't try to fetch if database is not connected
      setLoading(false)
      return
    }

    try {
      const params = new URLSearchParams({
        search: searchTerm,
        rating: ratingFilter,
        sortBy,
        sortOrder
      })
      
      const response = await fetch(`/api/clients?${params}`)
      if (response.ok) {
        const data = await response.json()
        setClients(data)
        setFilteredClients(data)
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to fetch clients",
          variant: "destructive",
        })
        
        // If it's a database connection error, update the status
        if (errorData.error?.includes('Database connection failed')) {
          setDbStatus({
            isConnected: false,
            message: errorData.error
          })
        }
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
      toast({
        title: "Error",
        description: "Network error while fetching clients",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Load data on mount and when filters change
  useEffect(() => {
    checkDatabaseStatus()
    
    // Set auth loading to false when auth state is determined
    if (!authStateLoading) {
      setAuthLoading(false)
    }
  }, [authStateLoading])

  useEffect(() => {
    fetchClients()
  }, [searchTerm, ratingFilter, sortBy, sortOrder, dbStatus.isConnected])

  // Load company settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('companySettings')
    if (savedSettings) {
      try {
        setCompanySettings(JSON.parse(savedSettings))
      } catch (error) {
        console.error('Error loading company settings:', error)
      }
    }
  }, [])

  const getColorCoding = (lastJobDate: Date | undefined) => {
    if (!lastJobDate) return "bg-gray-100"
    
    const monthsSince = (new Date().getTime() - new Date(lastJobDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
    
    if (monthsSince <= 3) return "bg-green-100 border-green-300"
    if (monthsSince <= 6) return "bg-yellow-100 border-yellow-300"
    if (monthsSince <= 9) return "bg-orange-100 border-orange-300"
    return "bg-red-100 border-red-300"
  }

  const renderStars = (rating: number, clientId: string) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 cursor-pointer transition-all duration-200 ${i < rating ? "fill-yellow-400 text-yellow-400 hover:scale-110" : "text-gray-300 hover:text-yellow-300 hover:scale-110"}`}
        onClick={(e) => {
          e.stopPropagation()
          handleRatingClick(clientId, i + 1)
        }}
      />
    ))
  }

  const handleAddClient = async () => {
    if (!dbStatus.isConnected) {
      toast({
        title: "Database Error",
        description: "Cannot add client - database connection is not available",
        variant: "destructive",
      })
      return
    }

    if (!newClient.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Client name is required",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newClient),
      })

      if (response.ok) {
        await fetchClients()
        setNewClient({
          name: "",
          email: "",
          phone: "",
          address: "",
          notes: "",
          rating: 0
        })
        setIsAddDialogOpen(false)
        toast({
          title: "Success",
          description: "Client added successfully",
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to add client",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error adding client:', error)
      toast({
        title: "Error",
        description: "Network error while adding client",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditClient = async () => {
    if (!editingClient) return
    
    if (!editingClient.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Client name is required",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/clients/${editingClient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingClient.name,
          email: editingClient.email,
          phone: editingClient.phone,
          address: editingClient.address,
          notes: editingClient.notes,
          rating: editingClient.rating
        }),
      })

      if (response.ok) {
        await fetchClients()
        setEditingClient(null)
        setIsEditDialogOpen(false)
        toast({
          title: "Success",
          description: "Client updated successfully",
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to update client",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error editing client:', error)
      toast({
        title: "Error",
        description: "Network error while updating client",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const openEditDialog = (client: ClientWithLastJob) => {
    setEditingClient(client)
    setIsEditDialogOpen(true)
  }

  const handleDeleteClient = async (clientId: string) => {
    if (confirm("Are you sure you want to delete this client? This will also delete all their jobs.")) {
      try {
        const response = await fetch(`/api/clients/${clientId}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await fetchClients()
          toast({
            title: "Success",
            description: "Client deleted successfully",
          })
        } else {
          const errorData = await response.json()
          toast({
            title: "Error",
            description: errorData.error || "Failed to delete client",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error('Error deleting client:', error)
        toast({
          title: "Error",
          description: "Network error while deleting client",
          variant: "destructive",
        })
      }
    }
  }

  const handleRatingClick = async (clientId: string, newRating: number) => {
    try {
      const client = clients.find(c => c.id === clientId)
      if (!client) return

      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: client.name,
          email: client.email,
          phone: client.phone,
          address: client.address,
          notes: client.notes,
          rating: newRating
        }),
      })

      if (response.ok) {
        await fetchClients()
        toast({
          title: "Success",
          description: `Client rating updated to ${newRating} star${newRating !== 1 ? 's' : ''}`,
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to update rating",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating rating:', error)
      toast({
        title: "Error",
        description: "Network error while updating rating",
        variant: "destructive",
      })
    }
  }

  const openJobDialog = (client: ClientWithLastJob) => {
    setSelectedClientForJob(client)
    setNewJob({
      date: new Date().toISOString().split('T')[0],
      price: "",
      notes: "",
      status: "completed"
    })
    setIsJobDialogOpen(true)
  }

  const handleAddJob = async () => {
    if (!selectedClientForJob) return
    
    if (!newJob.date || !newJob.price || isNaN(parseFloat(newJob.price))) {
      toast({
        title: "Validation Error",
        description: "Date and valid price are required",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: selectedClientForJob.id,
          date: newJob.date,
          price: parseFloat(newJob.price),
          notes: newJob.notes,
          status: newJob.status
        }),
      })

      if (response.ok) {
        await fetchClients()
        setIsJobDialogOpen(false)
        setSelectedClientForJob(null)
        setNewJob({
          date: "",
          price: "",
          notes: "",
          status: "completed"
        })
        toast({
          title: "Success",
          description: "Job added successfully",
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to add job",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error adding job:', error)
      toast({
        title: "Error",
        description: "Network error while adding job",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteJob = async (clientId: string, jobId: string) => {
    if (confirm("Are you sure you want to delete this job?")) {
      try {
        const response = await fetch(`/api/jobs/${jobId}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await fetchClients()
          toast({
            title: "Success",
            description: "Job deleted successfully",
          })
        } else {
          const errorData = await response.json()
          toast({
            title: "Error",
            description: errorData.error || "Failed to delete job",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error('Error deleting job:', error)
        toast({
          title: "Error",
          description: "Network error while deleting job",
          variant: "destructive",
        })
      }
    }
  }

  const openJobHistory = (client: ClientWithLastJob) => {
    setSelectedClientForHistory(client)
    setIsJobHistoryOpen(true)
  }

  const openClientDetail = (client: ClientWithLastJob) => {
    setSelectedClientForHistory(client)
    setIsJobHistoryOpen(true)
  }

  const openInvoiceDialog = (client: ClientWithLastJob) => {
    setSelectedClientForInvoice(client)
    // Calculate default payment date (30 days from now)
    const defaultPaymentDate = new Date()
    defaultPaymentDate.setDate(defaultPaymentDate.getDate() + 30)
    
    setInvoiceData({
      jobId: "",
      notes: "",
      logoUrl: "",
      serviceDescription: companySettings.defaultServiceDescription || "Window Cleaning Service",
      paymentDate: defaultPaymentDate.toISOString().split('T')[0] // Keep as YYYY-MM-DD for input field
    })
    setInvoiceLanguage(companySettings.defaultLanguage || "en")
    setIsInvoiceDialogOpen(true)
  }

  const generateInvoice = async () => {
    if (!selectedClientForInvoice) {
      console.error('No client selected for invoice')
      return
    }
    
    const selectedJob = selectedClientForInvoice.jobs?.find(job => job.id === invoiceData.jobId)
    if (!selectedJob) {
      console.error('No job selected for invoice')
      return
    }

    console.log('Starting invoice generation for client:', selectedClientForInvoice.name)
    console.log('Selected job:', selectedJob)

    // Language mappings
    const translations = {
      en: {
        invoice: "INVOICE",
        date: "Date",
        invoiceNumber: "Invoice #",
        billTo: "BILL TO:",
        description: "Description",
        serviceDate: "Date",
        amount: "Amount",
        total: "TOTAL:",
        windowCleaning: "Window Cleaning Service",
        notes: "Notes:",
        thankYou: "Thank you for your business!",
        bankInfo: "Bank Information",
        bankName: "Bank:",
        account: "Account:",
        bankCode: "Bank Code/SWIFT:",
        paymentDate: "Payment Due Date:"
      },
      lt: {
        invoice: "SĄSKAITA",
        date: "Data",
        invoiceNumber: "Sąskaitos nr.",
        billTo: "MOKĖTOJAS:",
        description: "Aprašymas",
        serviceDate: "Data",
        amount: "Suma",
        total: "VISO",
        windowCleaning: "Profilaktinis langų valymas",
        notes: "Pastabos",
        thankYou: "Dėkojame, kad pasirinkote mus!",
        bankInfo: "Banko informacija",
        bankName: "Bankas",
        account: "Sąskaita",
        bankCode: "Banko kodas/SWIFT",
        paymentDate: "Apmokėti iki"
      }
    }

    const t = translations[invoiceLanguage as keyof typeof translations] || translations.en

    // Format dates in European format dd/mm/yyyy
    const formatDate = (date: Date) => {
      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    }

    try {
      // Create a temporary iframe for complete style isolation
      console.log('Creating isolated iframe for invoice generation...')
      const iframe = document.createElement('iframe')
      iframe.style.position = 'absolute'
      iframe.style.left = '-9999px'
      iframe.style.top = '-9999px'
      iframe.style.width = '210mm'
      iframe.style.height = '297mm'
      document.body.appendChild(iframe)
      
      // Get the iframe document
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (!iframeDoc) {
        throw new Error('Could not access iframe document')
      }
      
      // Write a completely isolated HTML document
      console.log('Writing isolated HTML content...')
      
      const invoiceDate = formatDate(new Date())
      const invoiceNumber = `INV-${Date.now()}`
      const serviceDate = formatDate(new Date(selectedJob.date))
      const paymentDate = invoiceData.paymentDate ? formatDate(new Date(invoiceData.paymentDate)) : ''
      
      iframeDoc.open()
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              color: #000000;
              background-color: #ffffff;
              width: 210mm;
              padding: 20mm;
              line-height: 1.6;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 35px;
              line-height: 1.6;
            }
            .company-info {
              text-align: right;
              max-width: 50%;
              line-height: 1.6;
            }
            .company-logo {
              max-width: 180px;
              max-height: 75px;
              margin-bottom: 12px;
              display: block;
              margin-left: auto;
            }
            h1 {
              font-size: 24px;
              color: #333333;
              background-color: #ffffff;
              margin: 0 0 12px 0;
              line-height: 1.3;
              min-height: 28px;
            }
            h2 {
              font-size: 20px;
              color: #333333;
              background-color: #ffffff;
              margin: 0 0 12px 0;
              line-height: 1.3;
              min-height: 24px;
            }
            p {
              font-size: 12px;
              color: #666666;
              background-color: #ffffff;
              margin: 3px 0;
              line-height: 1.6;
              min-height: 16px;
              padding: 1px 0;
            }
            h3 {
              font-size: 14px;
              color: #333333;
              background-color: #ffffff;
              margin: 25px 0 12px 0;
              padding-bottom: 6px;
              border-bottom: 1px solid #cccccc;
              line-height: 1.4;
              min-height: 18px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 25px 0;
              background-color: #ffffff;
              line-height: 1.6;
            }
            th {
              padding: 12px 10px;
              text-align: left;
              font-size: 12px;
              border: 1px solid #dddddd;
              background-color: #f0f0f0;
              color: #000000;
              line-height: 1.4;
              font-weight: bold;
              min-height: 18px;
            }
            td {
              padding: 12px 10px;
              font-size: 11px;
              border: 1px solid #dddddd;
              background-color: #ffffff;
              color: #000000;
              line-height: 1.6;
              vertical-align: top;
              min-height: 16px;
            }
            .total {
              text-align: right;
              font-size: 14px;
              font-weight: bold;
              color: #333333;
              background-color: #ffffff;
              margin: 25px 0;
              line-height: 1.6;
              min-height: 20px;
              padding: 5px 0;
            }
            .thank-you {
              font-size: 10px;
              color: #666666;
              background-color: #ffffff;
              margin: 25px 0;
              line-height: 1.6;
              min-height: 14px;
              padding: 2px 0;
            }
            .bank-info {
              margin: 25px 0;
              padding: 18px 12px;
              background-color: #f9f9f9;
              border: 1px solid #eeeeee;
              line-height: 1.6;
            }
            .bank-info h4 {
              font-size: 12px;
              color: #333333;
              background-color: #f9f9f9;
              margin: 0 0 10px 0;
              line-height: 1.4;
              min-height: 16px;
            }
            .bank-info p {
              margin: 5px 0;
              line-height: 1.6;
              min-height: 16px;
              padding: 1px 0;
            }
            .notes {
              margin: 18px 0;
              font-size: 10px;
              color: #666666;
              background-color: #ffffff;
              line-height: 1.6;
              min-height: 14px;
              padding: 3px 0;
            }
            .footer {
              margin-top: 35px;
              padding-top: 25px;
              border-top: 1px solid #cccccc;
              line-height: 1.6;
            }
            .footer p {
              margin: 10px 0;
              line-height: 1.6;
              min-height: 14px;
              padding: 2px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>${t.invoice}</h1>
              <p>${t.date}: ${invoiceDate}</p>
              <p>${t.invoiceNumber}: ${invoiceNumber}</p>
            </div>
            <div class="company-info">
              ${companySettings.logoUrl ? `<img src="${companySettings.logoUrl}" alt="Company Logo" class="company-logo" onerror="this.style.display='none'">` : ''}
              <h2>${companySettings.name || 'Your Company'}</h2>
              ${companySettings.address ? `<p>${companySettings.address.replace(/\n/g, '<br>')}</p>` : ''}
              ${companySettings.phone ? `<p>Phone: ${companySettings.phone}</p>` : ''}
              ${companySettings.email ? `<p>Email: ${companySettings.email}</p>` : ''}
              ${companySettings.website ? `<p>Website: ${companySettings.website}</p>` : ''}
            </div>
          </div>
          
          <h3>${t.billTo}</h3>
          <p style="font-weight: bold;">${selectedClientForInvoice.name}</p>
          ${selectedClientForInvoice.address ? `<p>${selectedClientForInvoice.address.replace(/\n/g, '<br>')}</p>` : ''}
          ${selectedClientForInvoice.phone ? `<p>${selectedClientForInvoice.phone}</p>` : ''}
          ${selectedClientForInvoice.email ? `<p>${selectedClientForInvoice.email}</p>` : ''}
          
          <table>
            <tr>
              <th>${t.description}</th>
              <th>${t.serviceDate}</th>
              <th style="text-align: right;">${t.amount}</th>
            </tr>
            <tr>
              <td>${invoiceData.serviceDescription || t.windowCleaning}</td>
              <td>${serviceDate}</td>
              <td style="text-align: right;">$${selectedJob.price}</td>
            </tr>
          </table>
          
          ${invoiceData.notes ? `<div class="notes"><strong>${t.notes}:</strong> ${invoiceData.notes}</div>` : ''}
          
          <p class="total">${t.total}: $${selectedJob.price}</p>
          
          ${(companySettings.bankName || companySettings.bankAccount) ? `
            <div class="bank-info">
              <h4>${t.bankInfo}</h4>
              ${companySettings.bankName ? `<p><strong>${t.bankName}:</strong> ${companySettings.bankName}</p>` : ''}
              ${companySettings.bankAccount ? `<p><strong>${t.account}:</strong> ${companySettings.bankAccount}</p>` : ''}
              ${companySettings.bankCode ? `<p><strong>${t.bankCode}:</strong> ${companySettings.bankCode}</p>` : ''}
            </div>
          ` : ''}
          
          <div class="footer">
            ${paymentDate ? `<p>${t.paymentDate} ${paymentDate}</p>` : ''}
            <p class="thank-you">${t.thankYou}</p>
            
          </div>
        </body>
        </html>
      `)
      iframeDoc.close()
      
      console.log('HTML content written to iframe')
      
      // Convert to canvas using the iframe body
      console.log('Starting html2canvas conversion...')
      let canvas
      try {
        canvas = await html2canvas(iframeDoc.body, {
          scale: 1,
          logging: false,
          useCORS: false,
          allowTaint: false,
          backgroundColor: '#ffffff',
          width: iframeDoc.body.scrollWidth,
          height: iframeDoc.body.scrollHeight
        })
        console.log('html2canvas completed successfully')
      } catch (html2canvasError) {
        console.error('html2canvas failed:', html2canvasError)
        throw new Error(`html2canvas failed: ${html2canvasError instanceof Error ? html2canvasError.message : 'Unknown error'}`)
      }
      
      // Remove the iframe
      document.body.removeChild(iframe)
      
      console.log('Creating PDF from canvas...')
      // Create PDF from canvas
      let pdf
      try {
        const imgData = canvas.toDataURL('image/png')
        pdf = new jsPDF.default()
        const imgWidth = 210
        const pageHeight = 295
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        let heightLeft = imgHeight
        
        let position = 0
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
        
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight
          pdf.addPage()
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight
        }
        console.log('PDF created successfully')
      } catch (jsPdfError) {
        console.error('jsPDF failed:', jsPdfError)
        throw new Error(`jsPDF failed: ${jsPdfError instanceof Error ? jsPdfError.message : 'Unknown error'}`)
      }
      
      // Save the PDF
      const fileName = `invoice-${selectedClientForInvoice.name.replace(/\s+/g, '-')}-${Date.now()}.pdf`
      pdf.save(fileName)
      
      // Close dialogs and reset state
      setIsInvoiceDialogOpen(false)
      setSelectedClientForInvoice(null)
      
      toast({
        title: invoiceLanguage === 'lt' ? "Sąskaita sugeneruota" : "Invoice Generated",
        description: invoiceLanguage === 'lt' 
          ? `PDF sąskaita "${fileName}" buvo sugeneruota ir atsisiųsta.`
          : `PDF invoice "${fileName}" has been generated and downloaded.`,
      })
      
    } catch (error) {
      console.error('Error generating PDF invoice:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Error details:', errorMessage)
      
      toast({
        title: invoiceLanguage === 'lt' ? "Klaida" : "Error",
        description: invoiceLanguage === 'lt' 
          ? `Nepavyko sugeneruoti PDF sąskaitos. Klaida: ${errorMessage}`
          : `Failed to generate PDF invoice. Error: ${errorMessage}`,
        variant: "destructive",
      })
    }
  }

  const handleCalendarAddJob = async (date: Date, clientId: string, jobData: { price: string; notes: string; status: string }) => {
    if (!jobData.price || isNaN(parseFloat(jobData.price))) {
      toast({
        title: "Validation Error",
        description: "A valid price is required",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          date: date.toISOString(),
          price: parseFloat(jobData.price),
          notes: jobData.notes,
          status: jobData.status
        }),
      })

      if (response.ok) {
        await fetchClients()
        toast({
          title: "Success",
          description: "Job added successfully from calendar",
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to add job from calendar",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error adding job from calendar:', error)
      toast({
        title: "Error",
        description: "Network error while adding job from calendar",
        variant: "destructive",
      })
    }
  }

  // Show loading spinner while checking auth state
  if (authStateLoading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">Please sign in to access the CRM</p>
          <Button onClick={() => router.push('/login')}>
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  // Main app return
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Window Cleaning CRM Plus</h1>
              <p className="text-sm sm:text-base text-gray-600">Manage your window cleaning business with ease</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
              {/* Database Indicator */}
              <div className={`flex items-center gap-2 text-sm ${dbStatus.isConnected ? 'text-green-600' : 'text-red-600'}`}>
                <Database className={`h-4 w-4 ${dbStatus.isConnected ? 'text-green-600' : 'text-red-600'}`} />
                <span className="hidden sm:inline">{dbStatus.isConnected ? 'Database Connected' : 'Database Disconnected'}</span>
                <span className="sm:hidden">{dbStatus.isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
              
              {/* User Info & Logout */}
              {user && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                  <span className="text-sm text-gray-600 truncate max-w-[200px] sm:max-w-none">
                    {user.email}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={signOut}
                    className="flex items-center gap-1 w-full sm:w-auto justify-center"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Database Status Warning */}
        {!dbStatus.isConnected && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <h3 className="font-medium text-red-800">Database Connection Issue</h3>
                  <p className="text-sm text-red-700 mt-1">{dbStatus.message}</p>
                  <div className="mt-2 text-xs text-red-600">
                    <p>Please check your .env file and ensure your DATABASE_URL is properly configured with your Supabase credentials.</p>
                    <p className="mt-1">Current DATABASE_URL: {process.env.NEXT_PUBLIC_DATABASE_URL || 'Not set'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading clients...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="dashboard" className="space-y-6">
                {/* Controls */}
                <div className="space-y-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search clients, jobs, and notes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <Select value={ratingFilter} onValueChange={setRatingFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filter by rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Ratings</SelectItem>
                        <SelectItem value="5">5 Stars</SelectItem>
                        <SelectItem value="4">4+ Stars</SelectItem>
                        <SelectItem value="3">3+ Stars</SelectItem>
                        <SelectItem value="2">2+ Stars</SelectItem>
                        <SelectItem value="1">1+ Stars</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <div className="flex gap-2 col-span-1 sm:col-span-2 lg:col-span-2">
                      <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="rating">Rating</SelectItem>
                          <SelectItem value="price">Last Price</SelectItem>
                          <SelectItem value="date">Last Date</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                        className="shrink-0"
                      >
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full sm:col-span-1 lg:col-span-1">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Client
                        </Button>
                      </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Client</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name">Name *</Label>
                          <Input
                            id="name"
                            value={newClient.name}
                            onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                            placeholder="Client name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newClient.email}
                            onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                            placeholder="Email address"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={newClient.phone}
                            onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                            placeholder="Phone number"
                          />
                        </div>
                        <div>
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            value={newClient.address}
                            onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                            placeholder="Property address"
                          />
                        </div>
                        <div>
                          <Label htmlFor="notes">Notes</Label>
                          <Textarea
                            id="notes"
                            value={newClient.notes}
                            onChange={(e) => setNewClient({...newClient, notes: e.target.value})}
                            placeholder="Special instructions or notes"
                          />
                        </div>
                        <Button onClick={handleAddClient} className="w-full" disabled={submitting}>
                          {submitting ? "Adding..." : "Add Client"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  {/* Settings Button */}
                  <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" className="w-full sm:col-span-1 lg:col-span-1">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Company Settings</DialogTitle>
                        <p className="text-sm text-gray-600">Configure your company information for invoices</p>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="company-name">Company Name *</Label>
                          <Input
                            id="company-name"
                            value={companySettings.name}
                            onChange={(e) => setCompanySettings({...companySettings, name: e.target.value})}
                            placeholder="Your company name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="company-address">Address</Label>
                          <Textarea
                            id="company-address"
                            value={companySettings.address}
                            onChange={(e) => setCompanySettings({...companySettings, address: e.target.value})}
                            placeholder="Company address"
                            rows={3}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="company-phone">Phone</Label>
                            <Input
                              id="company-phone"
                              value={companySettings.phone}
                              onChange={(e) => setCompanySettings({...companySettings, phone: e.target.value})}
                              placeholder="Company phone"
                            />
                          </div>
                          <div>
                            <Label htmlFor="company-email">Email</Label>
                            <Input
                              id="company-email"
                              type="email"
                              value={companySettings.email}
                              onChange={(e) => setCompanySettings({...companySettings, email: e.target.value})}
                              placeholder="Company email"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="company-website">Website</Label>
                          <Input
                            id="company-website"
                            value={companySettings.website}
                            onChange={(e) => setCompanySettings({...companySettings, website: e.target.value})}
                            placeholder="https://yourcompany.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="company-logo">Company Logo</Label>
                          <div className="space-y-2">
                            <Input
                              id="company-logo"
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  const reader = new FileReader()
                                  reader.onload = (event) => {
                                    if (event.target?.result) {
                                      setCompanySettings({...companySettings, logoUrl: event.target.result as string})
                                    }
                                  }
                                  reader.readAsDataURL(file)
                                }
                              }}
                            />
                            {companySettings.logoUrl && (
                              <div className="mt-2">
                                <img 
                                  src={companySettings.logoUrl} 
                                  alt="Company Logo" 
                                  className="max-w-xs max-h-32 object-contain border rounded"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Bank Account Information */}
                        <div className="border-t pt-4">
                          <h3 className="text-lg font-medium mb-4">Bank Account Information</h3>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="bank-name">Bank Name</Label>
                              <Input
                                id="bank-name"
                                value={companySettings.bankName}
                                onChange={(e) => setCompanySettings({...companySettings, bankName: e.target.value})}
                                placeholder="Bank name"
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="bank-account">Account Number</Label>
                                <Input
                                  id="bank-account"
                                  value={companySettings.bankAccount}
                                  onChange={(e) => setCompanySettings({...companySettings, bankAccount: e.target.value})}
                                  placeholder="Account number"
                                />
                              </div>
                              <div>
                                <Label htmlFor="bank-code">Bank Code / SWIFT</Label>
                                <Input
                                  id="bank-code"
                                  value={companySettings.bankCode}
                                  onChange={(e) => setCompanySettings({...companySettings, bankCode: e.target.value})}
                                  placeholder="Bank code or SWIFT"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Language Settings */}
                        <div className="border-t pt-4">
                          <h3 className="text-lg font-medium mb-4">Language Settings</h3>
                          <div>
                            <Label htmlFor="default-language">Default Invoice Language</Label>
                            <Select value={companySettings.defaultLanguage} onValueChange={(value) => setCompanySettings({...companySettings, defaultLanguage: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select default language" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="lt">Lietuvių (Lithuanian)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="mt-4">
                            <Label htmlFor="default-service">Default Service Description</Label>
                            <Input
                              id="default-service"
                              value={companySettings.defaultServiceDescription}
                              onChange={(e) => setCompanySettings({...companySettings, defaultServiceDescription: e.target.value})}
                              placeholder="Window Cleaning Services"
                            />
                            <p className="text-sm text-gray-500 mt-1">This will be pre-filled when generating invoices</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-3 pt-4">
                          <Button 
                            onClick={() => {
                              // Save settings to localStorage
                              localStorage.setItem('companySettings', JSON.stringify(companySettings))
                              setIsSettingsDialogOpen(false)
                              toast({
                                title: "Settings Saved",
                                description: "Company settings have been saved successfully.",
                              })
                            }}
                            className="flex-1"
                          >
                            Save Settings
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => setIsSettingsDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  {/* Edit Client Dialog */}
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Client</DialogTitle>
                      </DialogHeader>
                      {editingClient && (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="edit-name">Name *</Label>
                            <Input
                              id="edit-name"
                              value={editingClient.name}
                              onChange={(e) => setEditingClient({...editingClient, name: e.target.value})}
                              placeholder="Client name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                              id="edit-email"
                              type="email"
                              value={editingClient.email || ""}
                              onChange={(e) => setEditingClient({...editingClient, email: e.target.value})}
                              placeholder="Email address"
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-phone">Phone</Label>
                            <Input
                              id="edit-phone"
                              value={editingClient.phone || ""}
                              onChange={(e) => setEditingClient({...editingClient, phone: e.target.value})}
                              placeholder="Phone number"
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-address">Address</Label>
                            <Input
                              id="edit-address"
                              value={editingClient.address || ""}
                              onChange={(e) => setEditingClient({...editingClient, address: e.target.value})}
                              placeholder="Property address"
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-notes">Notes</Label>
                            <Textarea
                              id="edit-notes"
                              value={editingClient.notes || ""}
                              onChange={(e) => setEditingClient({...editingClient, notes: e.target.value})}
                              placeholder="Special instructions or notes"
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-rating">Rating</Label>
                            <Select 
                              value={editingClient.rating.toString()} 
                              onValueChange={(value) => setEditingClient({...editingClient, rating: parseInt(value)})}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">No Rating</SelectItem>
                                <SelectItem value="1">1 Star</SelectItem>
                                <SelectItem value="2">2 Stars</SelectItem>
                                <SelectItem value="3">3 Stars</SelectItem>
                                <SelectItem value="4">4 Stars</SelectItem>
                                <SelectItem value="5">5 Stars</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handleEditClient} className="flex-1" disabled={submitting}>
                              {submitting ? "Saving..." : "Save Changes"}
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setIsEditDialogOpen(false)}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  
                  {/* Add Job Dialog */}
                  <Dialog open={isJobDialogOpen} onOpenChange={setIsJobDialogOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Job for {selectedClientForJob?.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="job-date">Date *</Label>
                          <Input
                            id="job-date"
                            type="date"
                            value={newJob.date}
                            onChange={(e) => setNewJob({...newJob, date: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="job-price">Price ($) *</Label>
                          <Input
                            id="job-price"
                            type="number"
                            value={newJob.price}
                            onChange={(e) => setNewJob({...newJob, price: e.target.value})}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="job-status">Status</Label>
                          <Select value={newJob.status} onValueChange={(value) => setNewJob({...newJob, status: value})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="scheduled">Scheduled</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="job-notes">Notes</Label>
                          <Textarea
                            id="job-notes"
                            value={newJob.notes}
                            onChange={(e) => setNewJob({...newJob, notes: e.target.value})}
                            placeholder="Job details or special instructions"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleAddJob} className="flex-1" disabled={submitting}>
                            {submitting ? "Adding..." : "Add Job"}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setIsJobDialogOpen(false)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  {/* Client Detail Dialog */}
                  <Dialog open={isJobHistoryOpen} onOpenChange={setIsJobHistoryOpen}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <span>Client Details</span>
                            <div className="flex">
                              {Array.from({ length: Math.min(selectedClientForHistory?.rating || 0, 5) }, (_, i) => (
                                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                          </div>
                        </DialogTitle>
                      </DialogHeader>
                      {selectedClientForHistory && (
                        <div className="space-y-6">
                          {/* Client Information */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                  <MapPin className="h-5 w-5" />
                                  Client Information
                                </span>
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      openEditDialog(selectedClientForHistory)
                                      setIsJobHistoryOpen(false)
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    onClick={() => {
                                      openJobDialog(selectedClientForHistory)
                                      setIsJobHistoryOpen(false)
                                    }}
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Job
                                  </Button>
                                </div>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium text-gray-600">Name</Label>
                                  <p className="text-lg font-semibold">{selectedClientForHistory.name}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-600">Phone</Label>
                                  <p className="text-lg font-semibold flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    {selectedClientForHistory.phone ? (
                                      <a 
                                        href={`tel:${selectedClientForHistory.phone.replace(/[^\d+]/g, '')}`}
                                        className="text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200 active:text-blue-900"
                                        onClick={(e) => {
                                          // Add haptic feedback on mobile if available
                                          if ('vibrate' in navigator) {
                                            navigator.vibrate(50);
                                          }
                                        }}
                                      >
                                        {selectedClientForHistory.phone}
                                      </a>
                                    ) : (
                                      <span className="text-gray-500">Not provided</span>
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                                  <p className="text-lg font-semibold flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    {selectedClientForHistory.email || 'Not provided'}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-600">Address</Label>
                                  <p className="text-lg font-semibold">{selectedClientForHistory.address || 'Not provided'}</p>
                                </div>
                              </div>
                              {selectedClientForHistory.notes && (
                                <div>
                                  <Label className="text-sm font-medium text-gray-600">Notes</Label>
                                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedClientForHistory.notes}</p>
                                </div>
                              )}
                              {selectedClientForHistory.lastJob && (
                                <div className="bg-blue-50 p-4 rounded-lg">
                                  <Label className="text-sm font-medium text-blue-800">Last Service</Label>
                                  <div className="flex items-center justify-between mt-1">
                                    <span className="text-blue-900 font-medium">
                                      {new Date(selectedClientForHistory.lastJob.date).toLocaleDateString()}
                                    </span>
                                    <span className="text-blue-900 font-bold text-lg">
                                      ${selectedClientForHistory.lastJob.price}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                          {/* Job History */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <History className="h-5 w-5" />
                                Job History
                                <Badge variant="outline" className="ml-auto">
                                  {selectedClientForHistory.jobs?.length || 0} jobs
                                </Badge>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              {selectedClientForHistory.jobs && selectedClientForHistory.jobs.length > 0 ? (
                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                  {selectedClientForHistory.jobs.map((job) => (
                                    <Card key={job.id} className="p-4 border-l-4 border-l-blue-500">
                                      <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                          <Calendar className="h-4 w-4 text-gray-500" />
                                          <span className="font-medium">
                                            {new Date(job.date).toLocaleDateString()}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <DollarSign className="h-4 w-4 text-green-600" />
                                          <span className="font-medium text-green-600">
                                            ${job.price}
                                          </span>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleDeleteJob(selectedClientForHistory.id, job.id)}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge variant={job.status === 'completed' ? 'default' : job.status === 'scheduled' ? 'secondary' : 'destructive'}>
                                          {job.status}
                                        </Badge>
                                      </div>
                                      {job.notes && (
                                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                          {job.notes}
                                        </p>
                                      )}
                                    </Card>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8 text-gray-500">
                                  <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                  <p>No job history found</p>
                                  <Button 
                                    variant="outline" 
                                    className="mt-4"
                                    onClick={() => {
                                      openJobDialog(selectedClientForHistory)
                                      setIsJobHistoryOpen(false)
                                    }}
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add First Job
                                  </Button>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                          {/* Quick Actions */}
                          <div className="flex gap-2 justify-end pt-4 border-t">
                            <Button 
                              variant="outline" 
                              onClick={() => openInvoiceDialog(selectedClientForHistory)}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Generate Invoice
                            </Button>
                            <Button 
                              variant="destructive" 
                              onClick={() => {
                                handleDeleteClient(selectedClientForHistory.id)
                                setIsJobHistoryOpen(false)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete Client
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  {/* Invoice Generation Dialog */}
                  <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Generate Invoice for {selectedClientForInvoice?.name}</DialogTitle>
                      </DialogHeader>
                      {selectedClientForInvoice && (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="invoice-job">Select Job *</Label>
                            <Select value={invoiceData.jobId} onValueChange={(value) => setInvoiceData({...invoiceData, jobId: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a job to invoice" />
                              </SelectTrigger>
                              <SelectContent>
                                {selectedClientForInvoice.jobs && selectedClientForInvoice.jobs.length > 0 ? (
                                  selectedClientForInvoice.jobs.map((job) => (
                                    <SelectItem key={job.id} value={job.id}>
                                      {new Date(job.date).toLocaleDateString()} - ${job.price} ({job.status})
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="" disabled>No jobs available</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="invoice-language">Invoice Language</Label>
                            <Select value={invoiceLanguage} onValueChange={setInvoiceLanguage}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select invoice language" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="lt">Lietuvių (Lithuanian)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="invoice-service-description">Service Description</Label>
                            <Input
                              id="invoice-service-description"
                              value={invoiceData.serviceDescription}
                              onChange={(e) => setInvoiceData({...invoiceData, serviceDescription: e.target.value})}
                              placeholder="Profilaktinis langų valymas"
                            />
                          </div>
                          <div>
                            <Label htmlFor="invoice-payment-date">Payment Due Date</Label>
                            <Input
                              id="invoice-payment-date"
                              type="date"
                              value={invoiceData.paymentDate}
                              onChange={(e) => setInvoiceData({...invoiceData, paymentDate: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="invoice-notes">Invoice Notes</Label>
                            <Textarea
                              id="invoice-notes"
                              value={invoiceData.notes}
                              onChange={(e) => setInvoiceData({...invoiceData, notes: e.target.value})}
                              placeholder="Thank you for your business!"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={generateInvoice} 
                              className="flex-1"
                              disabled={!invoiceData.jobId}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Generate Invoice
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setIsInvoiceDialogOpen(false)}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              {/* Client Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredClients.map((client, index) => (
                    <Card 
                      key={client.id} 
                      className={`border-2 transition-all duration-300 hover:shadow-xl hover:scale-105 ${getColorCoding(client.lastJob?.date)} animate-fade-in cursor-pointer`}
                      style={{ animationDelay: `${index * 100}ms` }}
                      onClick={() => openClientDetail(client)}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between">
                          <span className="text-lg">{client.name}</span>
                          <div className="flex gap-1">
                            {renderStars(client.rating, client.id)}
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          {client.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="h-4 w-4" />
                              <span>{client.email}</span>
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="h-4 w-4" />
                              <span>{client.phone}</span>
                            </div>
                          )}
                          {client.address && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span>{client.address}</span>
                            </div>
                          )}
                        </div>
                        
                        {client.notes && (
                          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            {client.notes}
                          </div>
                        )}
                        {client.lastJob && (
                          <div className="flex justify-between items-center pt-2 border-t">
                            <div className="text-sm">
                              <div className="font-medium">Last Service</div>
                              <div className="text-gray-600">
                                {new Date(client.lastJob.date).toLocaleDateString()}
                              </div>
                            </div>
                            <Badge variant="secondary">
                              ${client.lastJob.price}
                            </Badge>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2 pt-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1 min-w-[80px]"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditDialog(client)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1 min-w-[80px]"
                            onClick={(e) => {
                              e.stopPropagation()
                              openJobDialog(client)
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Job
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1 min-w-[80px]"
                            onClick={(e) => {
                              e.stopPropagation()
                              openJobHistory(client)
                            }}
                          >
                            <History className="h-4 w-4 mr-1" />
                            History
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1 min-w-[80px]"
                            onClick={(e) => {
                              e.stopPropagation()
                              openInvoiceDialog(client)
                            }}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Invoice
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteClient(client.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {filteredClients.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-500 text-lg">No clients found</div>
                    <p className="text-gray-400 mt-2">Try adjusting your search or add a new client</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="calendar" className="space-y-6">
                <CalendarView 
                  clients={clients} 
                  onClientClick={(client) => {
                    openClientDetail(client)
                  }}
                  onClientSelectForJob={(date, clientId) => {
                    const selectedClient = clients.find(c => c.id === clientId)
                    if (selectedClient) {
                      setSelectedClientForJob(selectedClient)
                      setNewJob({
                        date: date.toISOString().split('T')[0],
                        price: "",
                        notes: "",
                        status: "completed"
                      })
                      setIsJobDialogOpen(true)
                    }
                  }}
                  onAddJob={handleCalendarAddJob}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
        
        {/* Client Detail Dialog */}
        <Dialog open={isClientDetailOpen} onOpenChange={setIsClientDetailOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <span>{selectedClientForDetail?.name}</span>
                  <div className="flex gap-1">
                    {selectedClientForDetail && Array.from({ length: Math.min(selectedClientForDetail.rating, 5) }, (_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            {selectedClientForDetail && (
              <div className="space-y-6">
                {/* Client Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Client Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedClientForDetail.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-gray-500" />
                          <div>
                            <div className="font-medium">Email</div>
                            <div className="text-gray-600">{selectedClientForDetail.email}</div>
                          </div>
                        </div>
                      )}
                      {selectedClientForDetail.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-gray-500" />
                          <div>
                            <div className="font-medium">Phone</div>
                            <a 
                              href={`tel:${selectedClientForDetail.phone.replace(/[^\d+]/g, '')}`}
                              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200 active:text-blue-900"
                              onClick={(e) => {
                                // Add haptic feedback on mobile if available
                                if ('vibrate' in navigator) {
                                  navigator.vibrate(50);
                                }
                              }}
                            >
                              {selectedClientForDetail.phone}
                            </a>
                          </div>
                        </div>
                      )}
                      {selectedClientForDetail.address && (
                        <div className="flex items-center gap-3 md:col-span-2">
                          <MapPin className="h-5 w-5 text-gray-500" />
                          <div>
                            <div className="font-medium">Address</div>
                            <div className="text-gray-600">{selectedClientForDetail.address}</div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {selectedClientForDetail.notes && (
                      <div>
                        <div className="font-medium mb-2">Notes</div>
                        <div className="bg-gray-50 p-3 rounded text-gray-700">
                          {selectedClientForDetail.notes}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Job History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>Job History</span>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          openJobDialog(selectedClientForDetail)
                          setIsClientDetailOpen(false)
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Job
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedClientForDetail.jobs && selectedClientForDetail.jobs.length > 0 ? (
                      <div className="space-y-3">
                        {selectedClientForDetail.jobs
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((job, index) => (
                          <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-4">
                                <div className="font-medium">
                                  {new Date(job.date).toLocaleDateString()}
                                </div>
                                <Badge variant={job.status === 'completed' ? 'default' : job.status === 'scheduled' ? 'secondary' : 'destructive'}>
                                  {job.status}
                                </Badge>
                              </div>
                              {job.notes && (
                                <div className="text-sm text-gray-600 mt-1">{job.notes}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="font-medium text-green-600">${job.price}</div>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    // TODO: Implement job editing
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => {
                                    if (confirm("Are you sure you want to delete this job?")) {
                                      handleDeleteJob(selectedClientForDetail.id, job.id)
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No jobs found for this client</p>
                    )}
                  </CardContent>
                </Card>
                
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-3 pt-4 border-t">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      openEditDialog(selectedClientForDetail)
                      setIsClientDetailOpen(false)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Client
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      openInvoiceDialog(selectedClientForDetail)
                      setIsClientDetailOpen(false)
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Invoice
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this client?")) {
                        handleDeleteClient(selectedClientForDetail.id)
                        setIsClientDetailOpen(false)
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Client
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}