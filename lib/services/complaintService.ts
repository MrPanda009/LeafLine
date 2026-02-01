import { supabase } from '@/lib/supabase'
import { Complaint, DuplicateCheckResult, Profile, SeverityLevel } from '@/types/database'

const COMPLAINTS_MEDIA_BUCKET = 'complaints-media'
const MAX_PHOTOS = 5
const DUPLICATE_RADIUS_METERS = 20

/**
 * Validates if user has KYC verification and is not blocked
 */
export async function validateUserEligibility(userId: string): Promise<{
  eligible: boolean
  reason?: string
}> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('kyc_verified, is_blocked, spam_strikes')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return { eligible: false, reason: `Database error: ${error.message}` }
    }

    if (!profile) {
      return { eligible: false, reason: 'User profile not found. Please log out and log in again.' }
    }

    if (profile.is_blocked === true) {
      return { 
        eligible: false, 
        reason: 'Your account has been blocked due to spam or policy violations' 
      }
    }

    // For now, allow users without KYC verification (set to false to enforce KYC)
    const REQUIRE_KYC = false // Set to true to enforce KYC verification
    
    if (REQUIRE_KYC && profile.kyc_verified !== true) {
      return { 
        eligible: false, 
        reason: 'KYC verification required. Please complete KYC verification to submit complaints.' 
      }
    }

    // Optional: Check spam strikes threshold
    if (profile.spam_strikes && profile.spam_strikes >= 3) {
      return { 
        eligible: false, 
        reason: 'Your account has multiple spam strikes. Please contact support.' 
      }
    }

    return { eligible: true }
  } catch (error) {
    console.error('Error validating user eligibility:', error)
    return { eligible: false, reason: 'An unexpected error occurred' }
  }
}

/**
 * Checks for duplicate reports within 20 meters using PostGIS
 */
export async function checkForDuplicates(
  latitude: number,
  longitude: number,
  categoryId: string,
  title?: string
): Promise<DuplicateCheckResult | null> {
  try {
    const { data, error } = await supabase.rpc('check_for_duplicate_report', {
      p_latitude: latitude,
      p_longitude: longitude,
      p_category_id: categoryId,
      p_radius_meters: DUPLICATE_RADIUS_METERS
    })

    if (error) {
      console.error('Duplicate check RPC error:', error)
      // Don't block submission if RPC fails
      return null
    }

    // Return the closest duplicate if found
    if (data && data.length > 0) {
      return data[0] as DuplicateCheckResult
    }

    return null
  } catch (error) {
    console.error('Error checking for duplicates:', error)
    return null
  }
}

/**
 * Uploads media files to Supabase Storage
 * Folder structure: /{user_id}/{complaint_id}/{filename}
 */
export async function uploadComplaintMedia(
  files: File[],
  userId: string,
  complaintId?: string
): Promise<{
  success: boolean
  urls: string[]
  errors: string[]
}> {
  if (files.length > MAX_PHOTOS) {
    return {
      success: false,
      urls: [],
      errors: [`Maximum ${MAX_PHOTOS} photos allowed`]
    }
  }

  const urls: string[] = []
  const errors: string[] = []
  
  // Use temporary ID if complaint not created yet
  const tempComplaintId = complaintId || `temp_${Date.now()}`

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      errors.push(`File ${file.name} is not an image`)
      continue
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      errors.push(`File ${file.name} exceeds 5MB limit`)
      continue
    }

    try {
      // Generate unique filename
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(7)
      const extension = file.name.split('.').pop()
      const fileName = `${userId}/${tempComplaintId}/${timestamp}_${randomStr}.${extension}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(COMPLAINTS_MEDIA_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error(`Error uploading ${file.name}:`, error)
        errors.push(`Failed to upload ${file.name}: ${error.message}`)
        continue
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(COMPLAINTS_MEDIA_BUCKET)
        .getPublicUrl(fileName)

      urls.push(urlData.publicUrl)
    } catch (error) {
      console.error(`Exception uploading ${file.name}:`, error)
      errors.push(`Failed to upload ${file.name}`)
    }
  }

  return {
    success: errors.length === 0,
    urls,
    errors
  }
}

/**
 * Generates a DIGIPIN code based on location
 * Format: DL-{lat_int}-{lng_int} (10 characters)
 */
export function generateDigipin(latitude: number, longitude: number): string {
  const latInt = Math.floor(Math.abs(latitude) * 1000)
  const lngInt = Math.floor(Math.abs(longitude) * 1000)
  const latPrefix = latitude >= 0 ? 'N' : 'S'
  const lngPrefix = longitude >= 0 ? 'E' : 'W'
  
  return `${latPrefix}${latInt}${lngPrefix}${lngInt}`.substring(0, 10)
}

/**
 * Maps UI severity to database enum (L1-L4)
 */
export function mapSeverityToEnum(severity: string): SeverityLevel {
  const mapping: Record<string, SeverityLevel> = {
    'low': 'L1',
    'medium': 'L2',
    'high': 'L3',
    'critical': 'L4'
  }
  return mapping[severity.toLowerCase()] || 'L2'
}

/**
 * Submits a new complaint to the database
 */
export async function submitComplaint(params: {
  userId: string
  title: string
  description: string
  categoryId: string
  severity: SeverityLevel
  latitude: number
  longitude: number
  digipinCode: string
  mediaUrls?: string[]
}): Promise<{
  success: boolean
  complaintId?: string
  error?: string
}> {
  try {
    // Create PostGIS point format: POINT(longitude latitude)
    const locationPoint = `POINT(${params.longitude} ${params.latitude})`

    const { data, error } = await supabase
      .from('complaints')
      .insert({
        reporter_id: params.userId,
        title: params.title.trim(),
        description: params.description.trim(),
        category_id: params.categoryId,
        severity: params.severity,
        location: locationPoint,
        digipin_code: params.digipinCode,
        media_urls: params.mediaUrls || [],
        status: 'open',
        upvote_count: 0
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error inserting complaint:', error)
      return {
        success: false,
        error: `Failed to submit complaint: ${error.message}`
      }
    }

    return {
      success: true,
      complaintId: data.id
    }
  } catch (error) {
    console.error('Exception submitting complaint:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while submitting your complaint'
    }
  }
}

/**
 * Adds an upvote to an existing complaint
 */
export async function upvoteComplaint(
  complaintId: string,
  userId: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Check if user already upvoted
    const { data: existing } = await supabase
      .from('upvotes')
      .select('id')
      .eq('complaint_id', complaintId)
      .eq('user_id', userId)
      .single()

    if (existing) {
      return {
        success: false,
        error: 'You have already upvoted this complaint'
      }
    }

    // Insert upvote
    const { error: insertError } = await supabase
      .from('upvotes')
      .insert({
        complaint_id: complaintId,
        user_id: userId
      })

    if (insertError) {
      console.error('Error inserting upvote:', insertError)
      return {
        success: false,
        error: 'Failed to upvote complaint'
      }
    }

    // Increment upvote count
    const { error: updateError } = await supabase.rpc('increment_upvote_count', {
      complaint_id: complaintId
    })

    if (updateError) {
      console.error('Error incrementing upvote count:', updateError)
      // Don't return error since upvote was recorded
    }

    return { success: true }
  } catch (error) {
    console.error('Exception upvoting complaint:', error)
    return {
      success: false,
      error: 'An unexpected error occurred'
    }
  }
}

/**
 * Complete workflow for submitting a complaint with all checks
 */
export async function submitComplaintWorkflow(params: {
  userId: string
  title: string
  description: string
  categoryId: string
  severity: string // UI format: 'low', 'medium', 'high', 'critical'
  latitude: number
  longitude: number
  photos: File[]
}): Promise<{
  success: boolean
  complaintId?: string
  error?: string
  duplicate?: DuplicateCheckResult
}> {
  // Step 1: Validate user eligibility (KYC & Block status)
  const eligibility = await validateUserEligibility(params.userId)
  if (!eligibility.eligible) {
    return {
      success: false,
      error: eligibility.reason
    }
  }

  // Step 2: Check for duplicates
  const duplicate = await checkForDuplicates(
    params.latitude,
    params.longitude,
    params.categoryId,
    params.title
  )

  if (duplicate) {
    return {
      success: false,
      duplicate,
      error: 'A similar complaint already exists nearby'
    }
  }

  // Step 3: Upload media files
  let mediaUrls: string[] = []
  if (params.photos.length > 0) {
    const uploadResult = await uploadComplaintMedia(
      params.photos,
      params.userId
    )

    if (!uploadResult.success && uploadResult.errors.length > 0) {
      console.warn('Some photos failed to upload:', uploadResult.errors)
      // Continue with successfully uploaded photos
    }

    mediaUrls = uploadResult.urls
  }

  // Step 4: Generate DIGIPIN
  const digipinCode = generateDigipin(params.latitude, params.longitude)

  // Step 5: Map severity to enum
  const severityEnum = mapSeverityToEnum(params.severity)

  // Step 6: Submit complaint
  const result = await submitComplaint({
    userId: params.userId,
    title: params.title,
    description: params.description,
    categoryId: params.categoryId,
    severity: severityEnum,
    latitude: params.latitude,
    longitude: params.longitude,
    digipinCode,
    mediaUrls
  })

  return result
}
