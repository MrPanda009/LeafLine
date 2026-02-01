# Supabase Backend Implementation Guide

## Overview
This implementation provides a complete Supabase backend for the Civic Complaint System with the following features:

- ✅ KYC verification and spam guard checks
- ✅ PostGIS-based location tracking (10m accuracy)
- ✅ Duplicate complaint detection (20m radius)
- ✅ Media upload to Supabase Storage (max 5 photos)
- ✅ DIGIPIN code generation
- ✅ Severity level mapping (L1-L4)
- ✅ Complete audit trail with ticket history
- ✅ Upvote system for complaint prioritization

## File Structure

```
├── database/
│   ├── schema.sql                    # Complete database schema with PostGIS
│   ├── rpc_functions.sql            # RPC functions for duplicate checking
│   └── setup_categories.sql         # Category initialization
├── lib/
│   ├── services/
│   │   ├── complaintService.ts      # Complaint submission workflow
│   │   └── categoryService.ts       # Category fetching
│   └── supabase.ts                  # Supabase client
├── types/
│   └── database.ts                  # TypeScript type definitions
└── app/
    └── citizen-app/
        └── report/
            └── page.tsx             # Updated report submission page
```

## Setup Instructions

### 1. Database Setup

Run the SQL files in your Supabase SQL Editor in this order:

```sql
-- Step 1: Create schema (tables, enums, indexes)
-- File: database/schema.sql
-- This creates all tables with PostGIS support

-- Step 2: Create RPC functions
-- File: database/rpc_functions.sql
-- This adds the duplicate checking function

-- Step 3: Initialize categories
-- File: database/setup_categories.sql
-- This populates the categories table
```

### 2. Storage Bucket Setup

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `complaints-media`
3. Set it as **Public** bucket
4. Add storage policy (already in schema.sql):
   - Allow authenticated users to upload to their own folder
   - Allow public read access

Folder structure: `/{user_id}/{complaint_id}/{filename}`

### 3. Enable PostGIS Extension

In Supabase SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### 4. Environment Variables

Ensure your `.env.local` has:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Key Features Implementation

### 1. KYC Verification & Spam Guard

**File:** `lib/services/complaintService.ts`
**Function:** `validateUserEligibility()`

Checks before submission:
- ✅ `kyc_verified` = true
- ✅ `is_blocked` = false  
- ✅ `spam_strikes` < 3

**Usage:**
```typescript
const eligibility = await validateUserEligibility(userId)
if (!eligibility.eligible) {
  // Show error: eligibility.reason
}
```

### 2. Duplicate Detection (20m Radius)

**File:** `database/rpc_functions.sql`
**Function:** `check_for_duplicate_report()`

Uses PostGIS `ST_DWithin()` to find complaints within 20 meters:
- Same category
- Status: open or in_progress
- Returns closest match with distance

**Usage:**
```typescript
const duplicate = await checkForDuplicates(lat, lng, categoryId)
if (duplicate) {
  // Prompt user to upvote existing complaint
}
```

### 3. Media Upload (Max 5 Photos)

**File:** `lib/services/complaintService.ts`
**Function:** `uploadComplaintMedia()`

Features:
- ✅ Max 5 photos validation
- ✅ 5MB per file limit
- ✅ Image type validation
- ✅ Organized folder structure: `/{user_id}/{complaint_id}/{timestamp}_{random}.{ext}`
- ✅ Returns public URLs array

**Bucket:** `complaints-media` (Public read, authenticated upload)

### 4. Location Accuracy (10m)

**Browser Geolocation API:**
```typescript
navigator.geolocation.getCurrentPosition(
  callback,
  errorCallback,
  {
    enableHighAccuracy: true,  // Request 10m accuracy
    timeout: 10000,
    maximumAge: 0
  }
)
```

**Database Storage:**
```sql
-- PostGIS Geography type (SRID 4326)
location GEOGRAPHY(POINT, 4326)

-- Insert format:
location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
```

### 5. DIGIPIN Code Generation

**File:** `lib/services/complaintService.ts`
**Function:** `generateDigipin()`

Format: 10-character location code
Example: `N28773E77` → N(lat)E(lng)

```typescript
const digipin = generateDigipin(28.7741, 77.1025)
// Output: "N28773E77"
```

### 6. Severity Mapping

**UI Values:** `'low' | 'medium' | 'high' | 'critical'`
**Database Enum:** `'L1' | 'L2' | 'L3' | 'L4'`

**Mapping:**
- `low` → `L1`
- `medium` → `L2`
- `high` → `L3`
- `critical` → `L4`

**Function:** `mapSeverityToEnum()`

### 7. Complete Submission Workflow

**File:** `lib/services/complaintService.ts`
**Function:** `submitComplaintWorkflow()`

**Steps:**
1. ✅ Validate user eligibility (KYC + Block status)
2. ✅ Check for duplicates within 20m
3. ✅ Upload media files to Storage
4. ✅ Generate DIGIPIN code
5. ✅ Map severity to enum
6. ✅ Insert complaint to database

**Usage in Component:**
```typescript
const result = await submitComplaintWorkflow({
  userId: user.id,
  title: "Pothole on Main Street",
  description: "Large pothole causing accidents",
  categoryId: selectedCategory,
  severity: "high",
  latitude: 28.7741,
  longitude: 77.1025,
  photos: [file1, file2, file3]
})

if (!result.success) {
  if (result.duplicate) {
    // Show duplicate prompt
  } else {
    // Show error
  }
}
```

## Database Schema

### Main Tables

#### `profiles`
- User authentication and KYC status
- Fields: `kyc_verified`, `is_blocked`, `spam_strikes`

#### `complaints`
- Main complaint records
- Fields: `location` (PostGIS), `digipin_code`, `severity`, `media_urls[]`

#### `categories`
- Complaint categories with icons
- Hierarchical support via `parent_id`

#### `upvotes`
- User upvotes on complaints
- Unique constraint: one upvote per user per complaint

#### `ticket_history`
- Audit trail of status changes
- Auto-populated via trigger

#### `reviews`
- Citizen feedback on resolved complaints
- Rating: 1-5 stars

## RPC Functions

### `check_for_duplicate_report()`
```sql
Parameters:
  - p_latitude: DOUBLE PRECISION
  - p_longitude: DOUBLE PRECISION
  - p_category_id: UUID
  - p_radius_meters: INTEGER (default 20)

Returns: TABLE with closest duplicate complaint
```

### `increment_upvote_count()`
```sql
Parameters:
  - complaint_id: UUID

Returns: VOID (updates upvote_count atomically)
```

### `get_nearby_complaints()`
```sql
Parameters:
  - p_latitude: DOUBLE PRECISION
  - p_longitude: DOUBLE PRECISION
  - p_radius_meters: INTEGER (default 1000)
  - p_limit: INTEGER (default 50)

Returns: TABLE with complaints within radius
```

## UI Integration

### Report Page (`app/citizen-app/report/page.tsx`)

**Changes Made:**
- ✅ Integrated `fetchCategories()` service
- ✅ Integrated `submitComplaintWorkflow()` 
- ✅ Added error state display
- ✅ Enhanced GPS with `enableHighAccuracy: true`
- ✅ Photo validation (type, size, count)
- ✅ Loading states with spinner
- ✅ Duplicate complaint prompt
- ✅ KYC eligibility check (auto-handled in workflow)

**UI Elements Preserved:**
- ✅ Color scheme (no changes)
- ✅ 3-step wizard
- ✅ All existing buttons and inputs
- ✅ Voice-to-text feature
- ✅ Map component integration

## Error Handling

### User-Facing Errors

1. **KYC Not Verified:**
   - Message: "KYC verification required. Please complete KYC verification to submit complaints."
   - Action: Redirect to KYC page

2. **Account Blocked:**
   - Message: "Your account has been blocked due to spam or policy violations"
   - Action: Contact support

3. **Duplicate Found:**
   - Message: "A similar complaint already exists nearby"
   - Action: Prompt to upvote existing complaint

4. **Upload Failed:**
   - Message: Lists failed photos
   - Action: Continue with successful uploads

### Developer Errors (Console Only)

- RPC function errors (duplicate check)
- Storage upload errors
- Database insertion errors

## Testing Checklist

### Before Production

- [ ] PostGIS extension enabled
- [ ] All SQL files executed
- [ ] Storage bucket created and configured
- [ ] Categories populated
- [ ] Test user has `kyc_verified = true`
- [ ] Test complaint submission workflow
- [ ] Test duplicate detection (submit 2 within 20m)
- [ ] Test media upload (1, 3, 5 photos)
- [ ] Test validation (blocked user, no KYC)
- [ ] Test upvote functionality
- [ ] Verify RLS policies work correctly

## Performance Considerations

### Indexes Created

- ✅ Spatial index on `complaints.location` (GIST)
- ✅ Index on `complaints.status`
- ✅ Index on `complaints.category_id`
- ✅ Index on `complaints.created_at DESC`
- ✅ Index on `upvotes.complaint_id`

### Optimizations

- Duplicate check uses PostGIS `ST_DWithin` (fast spatial query)
- Upvote count cached in `complaints` table
- Media URLs stored as array (no joins needed)
- RPC functions use `SECURITY DEFINER` for performance

## Security

### RLS Policies

- ✅ Profiles: Users can view all, update own
- ✅ Categories: Public read, admin write
- ✅ Complaints: Public read, KYC users insert
- ✅ Upvotes: Users manage own only
- ✅ Storage: Users upload to own folder only

### Data Validation

- ✅ Photo type and size validation (client + storage)
- ✅ Location coordinate validation (RPC function)
- ✅ KYC check before submission
- ✅ Spam strike tracking
- ✅ Unique constraints on upvotes

## API Reference

### Complaint Service

```typescript
import { 
  submitComplaintWorkflow,
  validateUserEligibility,
  checkForDuplicates,
  uploadComplaintMedia,
  generateDigipin,
  mapSeverityToEnum,
  upvoteComplaint
} from '@/lib/services/complaintService'
```

### Category Service

```typescript
import {
  fetchCategories,
  fetchCategoryById
} from '@/lib/services/categoryService'
```

## Troubleshooting

### Common Issues

**1. "Categories table does not exist"**
- Run `database/schema.sql`
- Run `database/setup_categories.sql`

**2. "RPC function not found"**
- Run `database/rpc_functions.sql`
- Check PostGIS extension enabled

**3. "Storage upload failed"**
- Check bucket exists: `complaints-media`
- Verify bucket is Public
- Check storage policies

**4. "KYC verification required"**
- Update user profile:
  ```sql
  UPDATE profiles 
  SET kyc_verified = true 
  WHERE id = 'user_id';
  ```

**5. Location accuracy issues**
- Ensure HTTPS (required for geolocation)
- Check browser permissions
- Use `enableHighAccuracy: true`

## Support

For issues or questions:
1. Check Supabase Dashboard logs
2. Check browser console for errors
3. Verify database schema matches `schema.sql`
4. Review RLS policies

## License

This implementation follows the project requirements and maintains all existing UI elements without changes.
