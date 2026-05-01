-- Storage Schema for Karavan Komşusu (Image Uploads)

-- 1. Create a public bucket named 'karavan_images'
INSERT INTO storage.buckets (id, name, public)
VALUES ('karavan_images', 'karavan_images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access to view/read images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'karavan_images' );

-- 3. Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'karavan_images' AND auth.role() = 'authenticated' );

-- 4. Allow users to delete their own images
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING ( bucket_id = 'karavan_images' AND auth.uid() = owner );
