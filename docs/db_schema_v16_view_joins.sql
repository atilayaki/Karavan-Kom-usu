-- =====================================================================
-- v16 — View Improvements for Joins
-- - Update vw_geographic_notes to include profiles data
-- - Update vw_routes to include profiles data
-- =====================================================================

CREATE OR REPLACE VIEW vw_geographic_notes AS
SELECT 
  gn.id, gn.user_id, gn.note, gn.location_name, gn.created_at,
  p.full_name as profile_full_name,
  ST_Y(gn.location::geometry) as lat, 
  ST_X(gn.location::geometry) as lng 
FROM geographic_notes gn
LEFT JOIN profiles p ON gn.user_id = p.id;

CREATE OR REPLACE VIEW vw_routes AS
SELECT 
  r.id, r.user_id, r.title, r.description, r.start_location_name, r.end_location_name, r.created_at,
  p.full_name as profile_full_name,
  ST_AsGeoJSON(r.path)::json as geojson_path
FROM routes r
LEFT JOIN profiles p ON r.user_id = p.id;

GRANT SELECT ON vw_geographic_notes TO anon, authenticated;
GRANT SELECT ON vw_routes TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
