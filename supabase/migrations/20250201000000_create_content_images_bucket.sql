-- Create content-images bucket for editor inline images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content-images',
  'content-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can view images (public bucket)
CREATE POLICY "Public read access for content-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'content-images');

-- Policy: Authenticated users can upload images
CREATE POLICY "Authenticated users can upload content-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'content-images');

-- Policy: Users can update their own images
CREATE POLICY "Users can update own content-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'content-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policy: Users can delete their own images
CREATE POLICY "Users can delete own content-images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'content-images' AND (storage.foldername(name))[1] = auth.uid()::text);
