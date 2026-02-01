-- ============================================
-- Complete Database Schema for Civic Complaint System
-- Based on Final-schema.png requirements
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('citizen', 'authority', 'admin');
CREATE TYPE complaint_status AS ENUM ('open', 'in_progress', 'resolved', 'rejected', 'duplicate');
CREATE TYPE severity_level AS ENUM ('L1', 'L2', 'L3', 'L4');

-- ============================================
-- TABLE: profiles
-- User profiles with KYC and spam management
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role user_role DEFAULT 'citizen',
    phone_number TEXT,
    
    -- KYC Fields
    aadhar_hash TEXT UNIQUE,
    kyc_verified BOOLEAN DEFAULT FALSE,
    kyc_verified_at TIMESTAMPTZ,
    
    -- Spam & Block Management
    is_blocked BOOLEAN DEFAULT FALSE,
    blocked_at TIMESTAMPTZ,
    blocked_reason TEXT,
    spam_strikes INTEGER DEFAULT 0,
    
    -- Address Fields
    house_no TEXT,
    colony_name TEXT,
    pincode TEXT,
    map_lngh TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: categories
-- Complaint categories
-- ============================================

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    icon TEXT,
    description TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: complaints
-- Main complaints table with PostGIS location
-- ============================================

CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Reporter Info
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Complaint Details
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    severity severity_level DEFAULT 'L2',
    status complaint_status DEFAULT 'open',
    
    -- Location (PostGIS Geography for 10m accuracy)
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    digipin_code VARCHAR(10) NOT NULL,
    
    -- Media
    media_urls TEXT[] DEFAULT '{}',
    
    -- Assignment & Resolution
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    upvote_count INTEGER DEFAULT 0,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes
    CONSTRAINT valid_upvote_count CHECK (upvote_count >= 0)
);

-- Create spatial index for location queries
CREATE INDEX IF NOT EXISTS idx_complaints_location ON public.complaints USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON public.complaints(category_id);
CREATE INDEX IF NOT EXISTS idx_complaints_reporter ON public.complaints(reporter_id);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON public.complaints(created_at DESC);

-- ============================================
-- TABLE: upvotes
-- Track user upvotes on complaints
-- ============================================

CREATE TABLE IF NOT EXISTS public.upvotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate upvotes
    UNIQUE(complaint_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_upvotes_complaint ON public.upvotes(complaint_id);
CREATE INDEX IF NOT EXISTS idx_upvotes_user ON public.upvotes(user_id);

-- ============================================
-- TABLE: ticket_history
-- Audit trail for complaint status changes
-- ============================================

CREATE TABLE IF NOT EXISTS public.ticket_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    old_status complaint_status,
    new_status complaint_status NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_history_complaint ON public.ticket_history(complaint_id);
CREATE INDEX IF NOT EXISTS idx_ticket_history_created_at ON public.ticket_history(created_at DESC);

-- ============================================
-- TABLE: reviews
-- Citizen feedback on resolved complaints
-- ============================================

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One review per user per complaint
    UNIQUE(complaint_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_complaint ON public.reviews(complaint_id);

-- ============================================
-- STORAGE BUCKET SETUP
-- complaints-media bucket for photos
-- ============================================

-- Create storage bucket (run via Supabase dashboard or via SQL if supported)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('complaints-media', 'complaints-media', true)
-- ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

CREATE POLICY "Users can view all profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- CATEGORIES POLICIES
-- ============================================

CREATE POLICY "Anyone can view categories"
    ON public.categories FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Only admins can insert categories"
    ON public.categories FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- COMPLAINTS POLICIES
-- ============================================

CREATE POLICY "Anyone can view complaints"
    ON public.complaints FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "KYC verified users can insert complaints"
    ON public.complaints FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND kyc_verified = true 
            AND is_blocked = false
        )
    );

CREATE POLICY "Users can update own complaints"
    ON public.complaints FOR UPDATE
    TO authenticated
    USING (reporter_id = auth.uid());

CREATE POLICY "Authorities and admins can update assigned complaints"
    ON public.complaints FOR UPDATE
    TO authenticated
    USING (
        assigned_to = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'authority')
        )
    );

-- ============================================
-- UPVOTES POLICIES
-- ============================================

CREATE POLICY "Users can view all upvotes"
    ON public.upvotes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert own upvotes"
    ON public.upvotes FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own upvotes"
    ON public.upvotes FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- ============================================
-- TICKET HISTORY POLICIES
-- ============================================

CREATE POLICY "Anyone can view ticket history"
    ON public.ticket_history FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "System can insert ticket history"
    ON public.ticket_history FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ============================================
-- REVIEWS POLICIES
-- ============================================

CREATE POLICY "Anyone can view reviews"
    ON public.reviews FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert own reviews"
    ON public.reviews FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reviews"
    ON public.reviews FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- ============================================
-- STORAGE POLICIES
-- complaints-media bucket
-- ============================================

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload to own folder"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'complaints-media' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow public read access
CREATE POLICY "Public can view complaint media"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'complaints-media');

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_complaints_updated_at
    BEFORE UPDATE ON public.complaints
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert sample categories (only if not exists)
INSERT INTO public.categories (name, icon, description) VALUES
    ('Waste Management', '🗑️', 'Garbage collection, illegal dumping, overflowing bins'),
    ('Road Issues', '🚧', 'Potholes, damaged roads, road maintenance'),
    ('Street Lighting', '💡', 'Broken lights, dark areas, electrical issues'),
    ('Water Supply', '💧', 'Water leakage, shortage, quality issues'),
    ('Drainage', '🌊', 'Blocked drains, waterlogging, sewage issues')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- HELPFUL VIEWS
-- ============================================

-- View: complaints_with_details
CREATE OR REPLACE VIEW complaints_with_details AS
SELECT 
    c.*,
    p.email as reporter_email,
    p.phone_number as reporter_phone,
    cat.name as category_name,
    cat.icon as category_icon,
    ST_Y(c.location::geometry) as latitude,
    ST_X(c.location::geometry) as longitude,
    COALESCE(r.avg_rating, 0) as avg_rating,
    COALESCE(r.review_count, 0) as review_count
FROM public.complaints c
LEFT JOIN public.profiles p ON c.reporter_id = p.id
LEFT JOIN public.categories cat ON c.category_id = cat.id
LEFT JOIN (
    SELECT complaint_id, AVG(rating) as avg_rating, COUNT(*) as review_count
    FROM public.reviews
    GROUP BY complaint_id
) r ON c.id = r.complaint_id;

-- Grant access to view
GRANT SELECT ON complaints_with_details TO authenticated;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_kyc_verified ON public.profiles(kyc_verified) WHERE kyc_verified = true;
CREATE INDEX IF NOT EXISTS idx_profiles_blocked ON public.profiles(is_blocked) WHERE is_blocked = true;
CREATE INDEX IF NOT EXISTS idx_complaints_digipin ON public.complaints(digipin_code);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.profiles IS 'User profiles with KYC verification and spam management';
COMMENT ON TABLE public.complaints IS 'Main complaints table with PostGIS location for 10m accuracy';
COMMENT ON TABLE public.upvotes IS 'User upvotes on complaints for prioritization';
COMMENT ON TABLE public.ticket_history IS 'Audit trail of all complaint status changes';
COMMENT ON TABLE public.reviews IS 'User feedback on resolved complaints';
COMMENT ON COLUMN public.complaints.location IS 'PostGIS geography point (SRID 4326) for precise location tracking';
COMMENT ON COLUMN public.complaints.digipin_code IS '10-character location identifier for easy reference';
COMMENT ON COLUMN public.complaints.severity IS 'L1 (Low) to L4 (Critical) priority levels';

