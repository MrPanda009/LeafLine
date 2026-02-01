'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'

// Sample complaints data for the map
const complaints = [
  {
    id: "CLV-2024-001",
    category: "Waste Management",
    description: "Overflowing garbage bin near market",
    location: "Connaught Place",
    coordinates: [28.6315, 77.2167],
    status: "In Progress",
    priority: "High",
  },
  {
    id: "CLV-2024-002",
    category: "Street Light",
    description: "Street light not working for 3 days",
    location: "Karol Bagh",
    coordinates: [28.6519, 77.1900],
    status: "Pending",
    priority: "Medium",
  },
  {
    id: "CLV-2024-003",
    category: "Road Damage",
    description: "Large pothole causing traffic issues",
    location: "Dwarka Sector 12",
    coordinates: [28.5921, 77.0460],
    status: "Resolved",
    priority: "High",
  },
  {
    id: "CLV-2024-004",
    category: "Water Supply",
    description: "No water supply since morning",
    location: "Rohini Sector 7",
    coordinates: [28.7416, 77.1025],
    status: "In Progress",
    priority: "Critical",
  },
  {
    id: "CLV-2024-005",
    category: "Pollution",
    description: "Construction dust pollution affecting residents",
    location: "Vasant Kunj",
    coordinates: [28.5244, 77.1586],
    status: "Pending",
    priority: "Medium",
  },
  {
    id: "CLV-2024-006",
    category: "Waste Management",
    description: "Illegal dumping of construction waste",
    location: "Janakpuri",
    coordinates: [28.6219, 77.0831],
    status: "In Progress",
    priority: "High",
  },
]

export default function MapComponent() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current && typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        if (mapRef.current && !mapInstanceRef.current) {
          // Initialize map centered on Delhi
          mapInstanceRef.current = L.map(mapRef.current).setView([28.6139, 77.2090], 11)

          // Add tile layer
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(mapInstanceRef.current)

          // Add markers for each complaint
          complaints.forEach(complaint => {
            const color = complaint.status === "Resolved" ? "#10b981" : 
                         complaint.status === "In Progress" ? "#f59e0b" : "#ef4444"
            
            const marker = L.circleMarker(complaint.coordinates as [number, number], {
              radius: 8,
              fillColor: color,
              color: "#fff",
              weight: 2,
              opacity: 1,
              fillOpacity: 0.8
            }).addTo(mapInstanceRef.current)

            // Add popup with complaint details
            marker.bindPopup(`
              <div style="font-family: Inter, sans-serif; min-width: 200px;">
                <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #032221;">
                  ${complaint.id}
                </div>
                <div style="font-size: 12px; color: #4b5563; margin-bottom: 4px;">
                  <strong>Category:</strong> ${complaint.category}
                </div>
                <div style="font-size: 12px; color: #4b5563; margin-bottom: 4px;">
                  <strong>Location:</strong> ${complaint.location}
                </div>
                <div style="font-size: 12px; margin-bottom: 4px;">
                  <strong>Description:</strong> ${complaint.description}
                </div>
                <div style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; background-color: ${color}; color: white; margin-top: 8px;">
                  ${complaint.status}
                </div>
              </div>
            `, {
              maxWidth: 300
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
  }, [])

  return (
    <div className="relative">
      {/* Map Legend */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-[1000]">
        <h4 className="text-sm font-bold text-[#032221] mb-3">Status Legend</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-700">Resolved</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-xs text-gray-700">In Progress</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-xs text-gray-700">Pending</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapRef} className="w-full h-[600px] rounded-lg"></div>
    </div>
  )
}
