-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can upload their own assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own assets" ON storage.objects;

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assets' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to view files in their own folder
CREATE POLICY "Users can view own folder"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'assets' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update files in their own folder
CREATE POLICY "Users can update own folder"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'assets' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'assets' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete files in their own folder
CREATE POLICY "Users can delete own folder"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'assets' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to access all files
CREATE POLICY "Admins have full access"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'assets' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'assets' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);