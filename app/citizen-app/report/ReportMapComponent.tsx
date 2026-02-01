'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
// @ts-ignore
import 'leaflet/dist/leaflet.css'

interface ReportMapComponentProps {
  location: { lat: number; lng: number } | null
  onLocationSelect: (lat: number, lng: number) => void
}

export default function ReportMapComponent({ location, onLocationSelect }: ReportMapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    // Initialize map
    const map = L.map(mapContainer.current).setView([28.6139, 77.2090], 12)

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    // Handle map clicks
    map.on('click', (e: L.LeafletMouseEvent) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [onLocationSelect])

  // Update marker when location changes
  useEffect(() => {
    if (!mapRef.current || !location) return

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.remove()
    }

    // Create custom green icon
    const greenIcon = L.icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBkPSJNMTIuNSAwQzUuNTk2NDQgMCAwIDUuNTk2NDQgMCAxMi41QzAgMTkuNDAzNiAxMi41IDQxIDEyLjUgNDFDMTIuNSA0MSAyNSAxOS40MDM2IDI1IDEyLjVDMjUgNS41OTY0NCAxOS40MDM2IDAgMTIuNSAwWiIgZmlsbD0iIzAwREY4MSIvPgogIDxjaXJjbGUgY3g9IjEyLjUiIGN5PSIxMi41IiByPSI2IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    })

    // Add new marker
    const marker = L.marker([location.lat, location.lng], { icon: greenIcon })
      .addTo(mapRef.current)

    markerRef.current = marker

    // Center map on marker
    mapRef.current.setView([location.lat, location.lng], 15)
  }, [location])

  return <div ref={mapContainer} className="w-full h-64 rounded-lg mb-4" />
}
