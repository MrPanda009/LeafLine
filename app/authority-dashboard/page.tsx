'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useRole } from '@/hooks/useRole'

// Development backdoor - set to false in production
const DEV_BACKDOOR = true

// Sample complaint data - Replace with actual Supabase data
const initialComplaints = [
  {
    id: "CLV-2024-001",
    category: "Waste Management",
    description: "Overflowing garbage bin near market",
    location: "Connaught Place",
    coordinates: [28.6315, 77.2167],
    status: "In Progress",
    priority: "High",
    reportedBy: "Rahul Kumar",
    reportedDate: "2024-01-28",
    assignedTo: "Team A - Sanitation",
    images: 1,
    updates: 3
  },
  {
    id: "CLV-2024-002",
    category: "Street Light",
    description: "Street light not working for 3 days",
    location: "Karol Bagh",
    coordinates: [28.6519, 77.1900],
    status: "Pending",
    priority: "Medium",
    reportedBy: "Priya Sharma",
    reportedDate: "2024-01-29",
    assignedTo: "Team B - Electricity",
    images: 2,
    updates: 1
  },
  {
    id: "CLV-2024-003",
    category: "Road Damage",
    description: "Large pothole causing traffic issues",
    location: "Dwarka Sector 12",
    coordinates: [28.5921, 77.0460],
    status: "Resolved",
    priority: "High",
    reportedBy: "Amit Singh",
    reportedDate: "2024-01-25",
    assignedTo: "Team C - PWD",
    images: 3,
    updates: 5,
    resolvedDate: "2024-01-30"
  },
  {
    id: "CLV-2024-004",
    category: "Water Supply",
    description: "No water supply since morning",
    location: "Rohini Sector 7",
    coordinates: [28.7416, 77.1025],
    status: "In Progress",
    priority: "Critical",
    reportedBy: "Sneha Gupta",
    reportedDate: "2024-01-30",
    assignedTo: "Team D - Water Works",
    images: 0,
    updates: 2
  },
  {
    id: "CLV-2024-005",
    category: "Pollution",
    description: "Construction dust pollution affecting residents",
    location: "Vasant Kunj",
    coordinates: [28.5244, 77.1586],
    status: "Pending",
    priority: "Medium",
    reportedBy: "Vikram Mehta",
    reportedDate: "2024-01-31",
    assignedTo: "Team E - Environment",
    images: 4,
    updates: 0
  },
  {
    id: "CLV-2024-006",
    category: "Waste Management",
    description: "Illegal dumping of construction waste",
    location: "Janakpuri",
    coordinates: [28.6219, 77.0831],
    status: "In Progress",
    priority: "High",
    reportedBy: "Neha Kapoor",
    reportedDate: "2024-01-29",
    assignedTo: "Team A - Sanitation",
    images: 5,
    updates: 4
  },
  {
    id: "CLV-2024-007",
    category: "Street Light",
    description: "Multiple street lights out in colony",
    location: "Mayur Vihar Phase 1",
    coordinates: [28.6078, 77.2981],
    status: "Resolved",
    priority: "Medium",
    reportedBy: "Rajesh Verma",
    reportedDate: "2024-01-26",
    assignedTo: "Team B - Electricity",
    images: 1,
    updates: 3,
    resolvedDate: "2024-01-29"
  },
  {
    id: "CLV-2024-008",
    category: "Drainage",
    description: "Blocked drainage causing waterlogging",
    location: "Lajpat Nagar",
    coordinates: [28.5677, 77.2431],
    status: "Pending",
    priority: "Critical",
    reportedBy: "Kavita Jain",
    reportedDate: "2024-02-01",
    assignedTo: "Team F - Drainage",
    images: 2,
    updates: 0
  }
]

export default function AuthorityDashboard() {
  const router = useRouter()
  const { role, loading, user } = useRole()
  const [signingOut, setSigningOut] = useState(false)
  
  // Dashboard state
  const [complaints, setComplaints] = useState(initialComplaints)
  const [selectedComplaint, setSelectedComplaint] = useState<typeof initialComplaints[0] | null>(null)
  const [filterStatus, setFilterStatus] = useState("All")
  const [filterPriority, setFilterPriority] = useState("All")
  const [searchTerm, setSearchTerm] = useState("")
  const [view, setView] = useState<"list" | "map">("list")
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!DEV_BACKDOOR && !loading) {
      if (!user) {
        router.push('/login')
      } else if (role !== 'admin') {
        router.push('/citizen-app')
      }
    }
  }, [role, loading, user, router])

  // Initialize map
  useEffect(() => {
    if (view === "map" && mapRef.current && !mapInstanceRef.current && typeof window !== 'undefined') {
      // Dynamically import Leaflet only on client side
      import('leaflet').then((L) => {
        if (mapRef.current && !mapInstanceRef.current) {
          mapInstanceRef.current = L.map(mapRef.current).setView([28.6139, 77.2090], 11)
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(mapInstanceRef.current)

          // Add markers for complaints
          complaints.forEach(complaint => {
            const color = complaint.status === "Resolved" ? "green" : 
                         complaint.status === "In Progress" ? "orange" : "red"
            
            const marker = L.circleMarker(complaint.coordinates as [number, number], {
              radius: 8,
              fillColor: color,
              color: "#fff",
              weight: 2,
              opacity: 1,
              fillOpacity: 0.8
            }).addTo(mapInstanceRef.current)

            marker.bindPopup(`
              <div style="font-family: Inter, sans-serif;">
                <strong>${complaint.id}</strong><br/>
                ${complaint.category}<br/>
                ${complaint.location}<br/>
                <span style="color: ${color}; font-weight: bold;">${complaint.status}</span>
              </div>
            `)

            marker.on('click', () => {
              setSelectedComplaint(complaint)
            })
          })
        }
      })
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [view, complaints])

  const handleSignOut = async () => {
    try {
      setSigningOut(true)
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
      setSigningOut(false)
    }
  }

  const filteredComplaints = complaints.filter(complaint => {
    const matchesStatus = filterStatus === "All" || complaint.status === filterStatus
    const matchesPriority = filterPriority === "All" || complaint.priority === filterPriority
    const matchesSearch = complaint.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.category.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesPriority && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch(status) {
      case "Resolved": return "bg-green-100 text-green-800 border-green-300"
      case "In Progress": return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "Pending": return "bg-red-100 text-red-800 border-red-300"
      default: return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case "Critical": return "bg-red-600 text-white"
      case "High": return "bg-orange-500 text-white"
      case "Medium": return "bg-blue-500 text-white"
      case "Low": return "bg-gray-500 text-white"
      default: return "bg-gray-400 text-white"
    }
  }

  const updateComplaintStatus = (id: string, newStatus: string) => {
    setComplaints(complaints.map(c => 
      c.id === id ? { ...c, status: newStatus, resolvedDate: newStatus === "Resolved" ? new Date().toISOString().split('T')[0] : undefined } : c
    ))
    if (selectedComplaint && selectedComplaint.id === id) {
      setSelectedComplaint({ ...selectedComplaint, status: newStatus })
    }
  }

  if (!DEV_BACKDOOR && loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  if (!DEV_BACKDOOR && (!user || role !== 'admin')) return null

  return (
    <div className="min-h-screen bg-gray-50">
      
      <header className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
        <div className="container mx-auto px-6 py-10">
          <div className="flex items-center justify-between">
            {/* <div className="flex items-center space-x-3">
              <div className="bg-white rounded-lg p-2">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold">LEAFLINE</h1>
                <p className="text-sm text-green-100">Authority Dashboard</p>
              </div>
            </div> */}
            {/* <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium">{user?.email || 'Dev Mode'}</p>
                <p className="text-xs text-green-100">Municipal Corporation of Delhi</p>
              </div>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {signingOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </div> */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 pb-8 pt-6">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Filters and Controls */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setView("list")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${view === "list" ? "bg-green-600 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                >
                  <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  List View
                </button>
                <button
                  onClick={() => setView("map")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${view === "map" ? "bg-green-600 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                >
                  <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Map View
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                <input
                  type="text"
                  placeholder="Search by ID, location, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 px-4 py-2 bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full sm:w-auto px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>

                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="w-full sm:w-auto px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="All">All Priority</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6">
            {view === "list" ? (
              <div className="space-y-4">
                {filteredComplaints.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-lg font-medium">No complaints found</p>
                    <p className="text-sm">Try adjusting your filters</p>
                  </div>
                ) : (
                  filteredComplaints.map(complaint => (
                    <div 
                      key={complaint.id}
                      className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer bg-white"
                      onClick={() => setSelectedComplaint(complaint)}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-lg font-bold text-gray-900">{complaint.id}</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(complaint.priority)}`}>
                              {complaint.priority}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(complaint.status)}`}>
                              {complaint.status}
                            </span>
                          </div>
                          <p className="text-gray-700 font-medium mb-1">{complaint.description}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              {complaint.category}
                            </span>
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {complaint.location}
                            </span>
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {complaint.reportedDate}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 lg:ml-4">
                          <div className="text-right text-sm">
                            <p className="text-gray-600">Assigned to</p>
                            <p className="font-semibold text-gray-900">{complaint.assignedTo}</p>
                          </div>
                          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="flex space-x-4">
                <div className="flex-1" style={{ height: '600px' }}>
                  <div ref={mapRef} className="rounded-lg overflow-hidden border border-gray-300 h-full"></div>
                </div>
                {selectedComplaint && (
                  <div className="w-96 bg-gray-50 rounded-lg p-6 border border-gray-200 overflow-y-auto" style={{ maxHeight: '600px' }}>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-gray-900">Complaint Details</h3>
                      <button onClick={() => setSelectedComplaint(null)} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Complaint ID</p>
                        <p className="font-bold text-lg text-gray-900">{selectedComplaint.id}</p>
                      </div>
                      <div className="flex space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(selectedComplaint.priority)}`}>
                          {selectedComplaint.priority}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedComplaint.status)}`}>
                          {selectedComplaint.status}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Category</p>
                        <p className="font-medium text-gray-900">{selectedComplaint.category}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Description</p>
                        <p className="text-gray-900">{selectedComplaint.description}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Location</p>
                        <p className="font-medium text-gray-900">{selectedComplaint.location}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Reported By</p>
                        <p className="font-medium text-gray-900">{selectedComplaint.reportedBy}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Reported Date</p>
                        <p className="font-medium text-gray-900">{selectedComplaint.reportedDate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Assigned To</p>
                        <p className="font-medium text-gray-900">{selectedComplaint.assignedTo}</p>
                      </div>
                      <div className="flex items-center space-x-4 pt-2">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">{selectedComplaint.images}</p>
                          <p className="text-xs text-gray-600">Images</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">{selectedComplaint.updates}</p>
                          <p className="text-xs text-gray-600">Updates</p>
                        </div>
                      </div>
                      <div className="pt-4 space-y-2">
                        <p className="text-sm text-gray-600 mb-2">Update Status</p>
                        <select
                          value={selectedComplaint.status}
                          onChange={(e) => updateComplaintStatus(selectedComplaint.id, e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Complaint Detail Modal */}
      {selectedComplaint && view === "list" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedComplaint(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Complaint Details</h2>
              <button onClick={() => setSelectedComplaint(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Complaint ID</p>
                <p className="font-bold text-2xl text-gray-900">{selectedComplaint.id}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${getPriorityColor(selectedComplaint.priority)}`}>
                  Priority: {selectedComplaint.priority}
                </span>
                <span className={`px-4 py-2 rounded-lg text-sm font-semibold border ${getStatusColor(selectedComplaint.status)}`}>
                  Status: {selectedComplaint.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Category
                  </p>
                  <p className="font-semibold text-gray-900">{selectedComplaint.category}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    Location
                  </p>
                  <p className="font-semibold text-gray-900">{selectedComplaint.location}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Description</p>
                <p className="text-gray-900 leading-relaxed">{selectedComplaint.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Reported By</p>
                  <p className="font-semibold text-gray-900">{selectedComplaint.reportedBy}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Reported Date</p>
                  <p className="font-semibold text-gray-900">{selectedComplaint.reportedDate}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Assigned To</p>
                <p className="font-semibold text-gray-900">{selectedComplaint.assignedTo}</p>
              </div>

              {selectedComplaint.resolvedDate && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-sm text-green-700 mb-1">Resolved Date</p>
                  <p className="font-semibold text-green-900">{selectedComplaint.resolvedDate}</p>
                </div>
              )}

              <div className="flex items-center justify-around bg-gray-50 rounded-lg p-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{selectedComplaint.images}</p>
                  <p className="text-sm text-gray-600">Images Attached</p>
                </div>
                <div className="h-12 w-px bg-gray-300"></div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{selectedComplaint.updates}</p>
                  <p className="text-sm text-gray-600">Status Updates</p>
                </div>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-3 font-medium">Update Complaint Status</p>
                <select
                  value={selectedComplaint.status}
                  onChange={(e) => updateComplaintStatus(selectedComplaint.id, e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-medium"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-2">
                <button className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                  Assign Team
                </button>
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                  Add Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
