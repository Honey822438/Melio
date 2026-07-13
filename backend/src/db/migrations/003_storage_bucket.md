# Supabase Storage — Product Images Bucket Setup

Run these steps in your Supabase dashboard **once**, before testing image uploads.

---

## 1. Create the bucket

Go to **Storage → New bucket**:
- Name: `product-images`
- Public bucket: **YES** (so image URLs are publicly accessible without auth)

---

## 2. Set bucket policy (SQL Editor)

Run this in Supabase SQL Editor to allow authenticated users to upload
and anyone to read:

```sql
-- Allow public read on product-images bucket
CREATE POLICY "Public read product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Allow authenticated users (sellers) to upload
CREATE POLICY "Sellers can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Sellers can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);
```

> **Note:** Since our backend uses the `service_role` key (supabaseAdmin),
> these policies are bypassed server-side. The policies protect against
> direct client access only.

---

## 3. Verify

After creating the bucket, the URL format for images will be:
```
https://<your-project-id>.supabase.co/storage/v1/object/public/product-images/<filename>
```
