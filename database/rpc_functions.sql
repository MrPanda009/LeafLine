-- ============================================
-- RPC Functions for Complaint System
-- ============================================

-- Enable PostGIS extension for geographic calculations
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- Function: check_for_duplicate_report
-- Purpose: Check for existing complaints within specified radius using PostGIS
-- Parameters:
--   - p_latitude: Latitude of the new complaint
--   - p_longitude: Longitude of the new complaint
--   - p_category_id: Category ID to match
--   - p_radius_meters: Search radius in meters (default 20)
-- Returns: Array of nearby complaints with distance
-- ============================================

CREATE OR REPLACE FUNCTION check_for_duplicate_report(
    p_latitude DOUBLE PRECISION,
    p_longitude DOUBLE PRECISION,
    p_category_id UUID,
    p_radius_meters INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    distance_meters DOUBLE PRECISION,
    created_at TIMESTAMPTZ,
    upvote_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        c.description,
        ST_Distance(
            c.location::geography,
            ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
        ) as distance_meters,
        c.created_at,
        COALESCE(c.upvote_count, 0) as upvote_count
    FROM complaints c
    WHERE 
        c.category_id = p_category_id
        AND c.status IN ('open', 'in_progress')
        AND ST_DWithin(
            c.location::geography,
            ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
            p_radius_meters
        )
    ORDER BY distance_meters ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_for_duplicate_report TO authenticated;

-- ============================================
-- Function: increment_upvote_count
-- Purpose: Atomically increment upvote count for a complaint
-- Parameters:
--   - complaint_id: UUID of the complaint
-- ============================================

CREATE OR REPLACE FUNCTION increment_upvote_count(
    complaint_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE complaints
    SET upvote_count = COALESCE(upvote_count, 0) + 1
    WHERE id = complaint_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_upvote_count TO authenticated;

-- ============================================
-- Function: decrement_upvote_count
-- Purpose: Atomically decrement upvote count for a complaint
-- Parameters:
--   - complaint_id: UUID of the complaint
-- ============================================

CREATE OR REPLACE FUNCTION decrement_upvote_count(
    complaint_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE complaints
    SET upvote_count = GREATEST(COALESCE(upvote_count, 0) - 1, 0)
    WHERE id = complaint_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION decrement_upvote_count TO authenticated;

-- ============================================
-- Function: get_nearby_complaints
-- Purpose: Get all complaints within a specified radius
-- Parameters:
--   - p_latitude: Center latitude
--   - p_longitude: Center longitude
--   - p_radius_meters: Search radius in meters
--   - p_limit: Maximum number of results (default 50)
-- ============================================

CREATE OR REPLACE FUNCTION get_nearby_complaints(
    p_latitude DOUBLE PRECISION,
    p_longitude DOUBLE PRECISION,
    p_radius_meters INTEGER DEFAULT 1000,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    category_id UUID,
    severity TEXT,
    status TEXT,
    distance_meters DOUBLE PRECISION,
    upvote_count INTEGER,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        c.description,
        c.category_id,
        c.severity::TEXT,
        c.status::TEXT,
        ST_Distance(
            c.location::geography,
            ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
        ) as distance_meters,
        COALESCE(c.upvote_count, 0) as upvote_count,
        ST_Y(c.location::geometry) as latitude,
        ST_X(c.location::geometry) as longitude,
        c.created_at
    FROM complaints c
    WHERE ST_DWithin(
        c.location::geography,
        ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
        p_radius_meters
    )
    ORDER BY distance_meters ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_nearby_complaints TO authenticated;

-- ============================================
-- Function: record_ticket_history
-- Purpose: Record status changes in ticket history
-- Trigger function to automatically log changes
-- ============================================

CREATE OR REPLACE FUNCTION record_ticket_history()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
        INSERT INTO ticket_history (
            complaint_id,
            changed_by,
            old_status,
            new_status,
            comment
        ) VALUES (
            NEW.id,
            auth.uid(),
            OLD.status,
            NEW.status,
            'Status changed via system'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on complaints table
DROP TRIGGER IF EXISTS complaints_status_change ON complaints;
CREATE TRIGGER complaints_status_change
    AFTER UPDATE ON complaints
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION record_ticket_history();

-- ============================================
-- Function: validate_location_accuracy
-- Purpose: Validate that location is within acceptable accuracy
-- Used to prevent spoofed locations
-- ============================================

CREATE OR REPLACE FUNCTION validate_location_accuracy(
    p_latitude DOUBLE PRECISION,
    p_longitude DOUBLE PRECISION
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Basic validation: check if coordinates are within valid ranges
    IF p_latitude < -90 OR p_latitude > 90 THEN
        RETURN FALSE;
    END IF;
    
    IF p_longitude < -180 OR p_longitude > 180 THEN
        RETURN FALSE;
    END IF;
    
    -- Additional validation logic can be added here
    -- For example, checking if location is within service area
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION validate_location_accuracy TO authenticated;

-- ============================================
-- Comments for documentation
-- ============================================

COMMENT ON FUNCTION check_for_duplicate_report IS 
'Checks for duplicate complaints within specified radius using PostGIS geography. 
Returns the closest matching complaint if found within the radius.';

COMMENT ON FUNCTION increment_upvote_count IS 
'Atomically increments the upvote count for a complaint. 
Called when a user upvotes a complaint.';

COMMENT ON FUNCTION get_nearby_complaints IS 
'Returns complaints within specified radius of a location, ordered by distance. 
Useful for map views and location-based filtering.';

COMMENT ON FUNCTION record_ticket_history IS 
'Trigger function that automatically records all status changes to the ticket_history table. 
Maintains audit trail of complaint lifecycle.';
