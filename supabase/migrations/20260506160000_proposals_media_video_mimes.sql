-- Extend proposals-media bucket for proposal deck video uploads (Phase: matrix / video / comparison blocks).
update storage.buckets
set
  file_size_limit = 104857600,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]::text[]
where id = 'proposals-media';
