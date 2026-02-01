'use client'

import { useState, useEffect, ComponentType } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useRole } from '@/hooks/useRole'
import { fetchCategories } from '@/lib/services/categoryService'
import { 
  submitComplaintWorkflow, 
  upvoteComplaint,
  generateDigipin 
} from '@/lib/services/complaintService'
import { Category, DuplicateCheckResult } from '@/types/database'

type Step = 1 | 2 | 3

// Dynamically import map to avoid SSR issues
const ReportMapComponent = dynamic<{
  location: { lat: number; lng: number } | null
  onLocationSelect: (lat: number, lng: number) => void
  // @ts-ignore
}>(() => import('./ReportMapComponent').then(mod => mod.default), { ssr: false }) as ComponentType<{
  location: { lat: number; lng: number } | null
  onLocationSelect: (lat: number, lng: number) => void
}>

export default function ReportPage() {
  const router = useRouter()
  const { user } = useRole()

  // Form state
  const [step, setStep] = useState<Step>(1)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [digipin, setDigipin] = useState<string>('')
  const [photos, setPhotos] = useState<File[]>([])
  const [description, setDescription] = useState('')
  const [title, setTitle] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [subcategories, setSubcategories] = useState<Category[]>([])
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('')
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [isRecording, setIsRecording] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [duplicateCheck, setDuplicateCheck] = useState<DuplicateCheckResult | null>(null)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isEligible, setIsEligible] = useState<boolean>(true)
  const [eligibilityMessage, setEligibilityMessage] = useState<string>('')
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  // Fetch categories using service
  useEffect(() => {
    async function loadCategories() {
      setCategoriesLoading(true)
      setCategoriesError(null)
      
      const result = await fetchCategories()
      
      if (result.success) {
        // Filter parent categories (no parent_id)
        const parentCategories = result.categories.filter(cat => !cat.parent_id)
        setCategories(parentCategories)
      } else {
        setCategoriesError(result.error || 'Failed to load categories')
      }
      
      setCategoriesLoading(false)
    }

    loadCategories()
  }, [])

  // Load subcategories when category is selected
  useEffect(() => {
    async function loadSubcategories() {
      if (!selectedCategory) {
        setSubcategories([])
        setSelectedSubcategory('')
        return
      }

      const result = await fetchCategories()
      if (result.success) {
        // Filter subcategories for selected category
        const subs = result.categories.filter(cat => cat.parent_id === selectedCategory)
        setSubcategories(subs)
        if (subs.length === 0) {
          // No subcategories, use parent category as final selection
          setSelectedSubcategory('')
        }
      }
    }

    loadSubcategories()
  }, [selectedCategory])

  // Get GPS location
  const handleGetGPS = () => {
    if (!('geolocation' in navigator)) {
      alert('❌ Geolocation is not supported by your browser')
      return
    }

    setIsGettingLocation(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        setLocation({ lat, lng })
        // Use the service function to generate DIGIPIN
        setDigipin(generateDigipin(lat, lng))
        setIsGettingLocation(false)
        console.log('Location obtained:', { lat, lng, accuracy: position.coords.accuracy })
      },
      (error) => {
        setIsGettingLocation(false)
        console.error('Geolocation error:', error)
        
        let errorMessage = 'Unable to get your location. '
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'You denied the request for location access. Please enable location permissions in your browser settings.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable. Please try again or select location on map.'
            break
          case error.TIMEOUT:
            errorMessage += 'The request to get your location timed out. Please try again.'
            break
          default:
            errorMessage += error.message || 'An unknown error occurred.'
        }
        
        alert(errorMessage)
      },
      {
        enableHighAccuracy: true, // Request 10m accuracy
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  // Handle map click
  const handleMapClick = (lat: number, lng: number) => {
    setLocation({ lat, lng })
    setDigipin(generateDigipin(lat, lng))
  }

  // Handle photo upload (Max 5 photos)
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      
      // Validate total count
      if (photos.length + newFiles.length > 5) {
        alert('Maximum 5 photos allowed')
        e.target.value = ''
        return
      }

      // Validate file types and sizes
      const invalidFiles = newFiles.filter(file => 
        !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024
      )

      if (invalidFiles.length > 0) {
        alert('All files must be images under 5MB')
        e.target.value = ''
        return
      }

      setPhotos([...photos, ...newFiles])
      e.target.value = ''
    }
  }

  // Remove photo
  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index))
  }

  // Voice to text
  const handleVoiceToText = () => {
    // Check browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.')
      return
    }

    try {
      const recognition = new SpeechRecognition()

      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsRecording(true)
        console.log('Speech recognition started')
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setDescription(prev => prev ? prev + ' ' + transcript : transcript)
        setIsRecording(false)
        console.log('Transcript:', transcript)
      }

      recognition.onerror = (event: any) => {
        setIsRecording(false)
        console.error('Speech recognition error:', event.error)
        alert(`Speech recognition error: ${event.error}. Please try again.`)
      }

      recognition.onend = () => {
        setIsRecording(false)
        console.log('Speech recognition ended')
      }

      recognition.start()
    } catch (error) {
      setIsRecording(false)
      console.error('Error starting speech recognition:', error)
      alert('Failed to start speech recognition. Please try again.')
    }
  }

  // Check for duplicates
  const checkDuplicates = async () => {
    // This function is now handled by the service
    // Kept for compatibility but unused
    return null
  }

  // Submit report using complete workflow
  const handleSubmit = async () => {
    // Clear previous errors
    setSubmitError(null)

    // Validate required fields
    if (!location) {
      setSubmitError('Please select a location')
      return
    }
    
    if (!title || !title.trim()) {
      setSubmitError('Please enter a title')
      return
    }
    
    if (!description || !description.trim()) {
      setSubmitError('Please enter a description')
      return
    }
    
    if (!selectedCategory) {
      setSubmitError('Please select a category')
      return
    }

    // Check if subcategories exist and one is selected
    if (subcategories.length > 0 && !selectedSubcategory) {
      setSubmitError('Please select a subcategory')
      return
    }

    // Check if user is logged in
    if (!user) {
      setSubmitError('Please log in to submit a report')
      return
    }

    setIsSubmitting(true)

    try {
      console.log('Submitting complaint via workflow...')
      
      // Use the complete workflow from service
      const result = await submitComplaintWorkflow({
        userId: user.id,
        title: title.trim(),
        description: description.trim(),
        categoryId: selectedSubcategory || selectedCategory, // Use subcategory if available
        severity: severity,
        latitude: location.lat,
        longitude: location.lng,
        photos: photos
      })

      if (!result.success) {
        // Check if it's a duplicate
        if (result.duplicate) {
          setDuplicateCheck(result.duplicate)
          setIsSubmitting(false)
          return
        }

        // Show error message
        setSubmitError(result.error || 'Failed to submit complaint')
        setIsSubmitting(false)
        return
      }

      // Success!
      console.log('Complaint submitted successfully:', result.complaintId)
      alert('✅ Report submitted successfully!')
      
      // Navigate to my reports
      router.push('/citizen-app/my-reports')
    } catch (error) {
      console.error('Submission error:', error)
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle upvote existing complaint
  const handleUpvoteExisting = async () => {
    if (!duplicateCheck || !user) return

    try {
      const result = await upvoteComplaint(duplicateCheck.id, user.id)

      if (!result.success) {
        alert(result.error || 'Failed to upvote')
        return
      }

      alert('✅ Upvoted existing report!')
      router.push('/citizen-app/dashboard')
    } catch (error) {
      console.error('Upvote error:', error)
      alert('Failed to upvote complaint')
    }
  }

  // Render duplicate prompt
  if (duplicateCheck) {
    return (
      <div className="min-h-screen bg-[#FDFBD4] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Similar Report Found
          </h2>
          <p className="text-gray-700 mb-6">
            A similar issue has already been reported in this area. Would you like to upvote the existing report instead?
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">{duplicateCheck.title}</h3>
            <p className="text-sm text-gray-600">{duplicateCheck.description}</p>
            <div className="mt-2 text-xs text-gray-500">
              Reported: {new Date(duplicateCheck.created_at).toLocaleDateString()}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleUpvoteExisting}
              className="flex-1 px-6 py-3 bg-[#00DF81] text-[#032221] font-medium rounded-lg hover:bg-[#00c972] transition-colors"
            >
              Upvote Existing Report
            </button>
            <button
              onClick={() => setDuplicateCheck(null)}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
            >
              Submit New Report Anyway
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFBD4] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step >= s ? 'bg-[#00DF81] text-[#032221]' : 'bg-gray-300 text-gray-600'
                }`}>
                  {s}
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    step > s ? 'bg-[#00DF81]' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-sm font-medium text-gray-700">Location</span>
            <span className="text-sm font-medium text-gray-700">Evidence</span>
            <span className="text-sm font-medium text-gray-700">Details</span>
          </div>
        </div>

        {/* Step 1: Location */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Select Location</h2>
            
            <button
              type="button"
              onClick={handleGetGPS}
              disabled={isGettingLocation}
              className="mb-4 w-full px-6 py-3 bg-[#00DF81] text-[#032221] font-medium rounded-lg hover:bg-[#00c972] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGettingLocation ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#032221]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Getting Location...
                </span>
              ) : (
                '📍 Use My Current Location'
              )}
            </button>

            <ReportMapComponent 
              location={location}
              onLocationSelect={handleMapClick}
            />

            {location && (
              <div className="p-4 bg-gray-50 rounded-lg mb-4">
                <p className="text-sm text-gray-700">
                  <strong>DIGIPIN:</strong> {digipin}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
                </p>
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              disabled={!location}
              className="w-full px-6 py-3 bg-[#829c86] text-white font-medium rounded-lg hover:bg-[#6d8371] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next: Add Evidence
            </button>
          </div>
        )}

        {/* Step 2: Evidence */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Evidence</h2>

            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00DF81] focus:border-transparent"
                placeholder="Brief description of the issue"
              />
            </div>

            {/* Photo Upload */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photos (Max 5) {photos.length > 0 && `- ${photos.length} selected`}
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                disabled={photos.length >= 5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#00DF81] file:text-[#032221] hover:file:bg-[#00c972] disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {photos.length >= 5 && (
                <p className="text-sm text-orange-600 mt-1">Maximum limit reached. Remove a photo to add more.</p>
              )}
              {photos.length > 0 && (
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {photos.map((photo, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-20 object-cover rounded border-2 border-gray-200"
                      />
                      <button
                        onClick={() => removePhoto(idx)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors shadow-lg"
                        type="button"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00DF81] focus:border-transparent"
                placeholder="Describe the issue in detail..."
              />
              <button
                onClick={handleVoiceToText}
                className={`mt-2 px-4 py-2 ${isRecording ? 'bg-red-500' : 'bg-[#829c86]'} text-white rounded-lg hover:opacity-90 transition-opacity`}
              >
                {isRecording ? '🎤 Recording...' : '🎤 Voice to Text'}
              </button>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!title || !description}
                className="flex-1 px-6 py-3 bg-[#829c86] text-white font-medium rounded-lg hover:bg-[#6d8371] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Category & Submit
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Category & Severity */}
        {step === 3 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Categorize Issue</h2>

            {/* Error Display */}
            {submitError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm font-medium">⚠️ {submitError}</p>
              </div>
            )}

            {/* Category */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              
              {categoriesLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00DF81]"></div>
                  <p className="text-sm text-gray-600 mt-2">Loading categories...</p>
                </div>
              ) : categoriesError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{categoriesError}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                  >
                    Retry
                  </button>
                </div>
              ) : categories.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">No categories available. Please contact administrator.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.id)
                        setSelectedSubcategory('')
                      }}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        selectedCategory === cat.id
                          ? 'border-[#00DF81] bg-[#00DF81]/10'
                          : 'border-gray-300 hover:border-[#829c86]'
                      }`}
                    >
                      <div className="text-3xl mb-2">{cat.icon}</div>
                      <div className="text-sm font-medium text-gray-900">{cat.name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Subcategory */}
            {selectedCategory && subcategories.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategory *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {subcategories.map((subcat) => (
                    <button
                      key={subcat.id}
                      type="button"
                      onClick={() => setSelectedSubcategory(subcat.id)}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        selectedSubcategory === subcat.id
                          ? 'border-[#00DF81] bg-[#00DF81]/10'
                          : 'border-gray-300 hover:border-[#829c86]'
                      }`}
                    >
                      <div className="text-3xl mb-2">{subcat.icon}</div>
                      <div className="text-sm font-medium text-gray-900">{subcat.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Severity */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity *
              </label>
              <div className="grid grid-cols-4 gap-4">
                {(['low', 'medium', 'high', 'critical'] as const).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverity(sev)}
                    className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                      severity === sev
                        ? sev === 'critical' ? 'bg-red-600 text-white'
                          : sev === 'high' ? 'bg-orange-600 text-white'
                          : sev === 'medium' ? 'bg-yellow-600 text-white'
                          : 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {sev.charAt(0).toUpperCase() + sev.slice(1)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                L1 (Low) → L2 (Medium) → L3 (High) → L4 (Critical)
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!selectedCategory || (subcategories.length > 0 && !selectedSubcategory) || isSubmitting}
                className="flex-1 px-6 py-3 bg-[#00DF81] text-[#032221] font-medium rounded-lg hover:bg-[#00c972] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#032221]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  'Submit Report'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
