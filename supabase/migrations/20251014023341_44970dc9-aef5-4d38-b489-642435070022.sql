-- Allow admins to upload to the filler folder in assets bucket
CREATE POLICY "Admins can upload filler media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assets' 
  AND (storage.foldername(name))[1] = 'filler'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to update filler media
CREATE POLICY "Admins can update filler media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'assets' 
  AND (storage.foldername(name))[1] = 'filler'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete filler media
CREATE POLICY "Admins can delete filler media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'assets' 
  AND (storage.foldername(name))[1] = 'filler'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow everyone to view filler media (for players)
CREATE POLICY "Anyone can view filler media"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'assets' 
  AND (storage.foldername(name))[1] = 'filler'
);