# Media Storage

Bagicha uses **MinIO** (S3-compatible) for image hosting.

## Topology

- One MinIO instance (Docker Compose service `minio` on port 9000, console on 9001).
- Single bucket `bagicha-media`, prefixed by feature:
  - `posts/<userId>/<uuid>.jpg` — community post photos. **Public-read.**
  - `vision/<userId>/<uuid>.jpg` — diagnose / identify uploads. Private (presigned GET).
  - `journal/<userId>/<uuid>.jpg` — plant journal photos. Private (presigned GET).
- Bucket policy is auto-applied at boot (`MediaService.ensureBucket`) — adds an
  `s3:GetObject` allow for the `posts/*` prefix only.

## Upload flow

Client → backend (multipart) → MinIO. The backend processes the image with
**Sharp** before uploading: EXIF orientation is honored then stripped, the long
edge is capped at **2048 px**, and the file is re-encoded as **mozjpeg quality 82**.
Raw upload is capped at **8 MB**.

```
POST /api/v1/media/images
  Authorization: Bearer <jwt>
  Content-Type: multipart/form-data

  fields:
    kind: "post" | "vision" | "journal"
    file: <binary>

200 OK
  {
    "success": true,
    "data": {
      "key": "posts/<userId>/<uuid>.jpg",
      "url": "http://localhost:9000/bagicha-media/posts/<userId>/<uuid>.jpg",
      "bucket": "bagicha-media",
      "width": 1620,
      "height": 2048,
      "bytes": 312456,
      "content_type": "image/jpeg",
      "is_public": true
    }
  }
```

For private prefixes (`vision`, `journal`) the returned `url` is a presigned
GET URL valid for **1 hour**. To refresh later:

```
GET /api/v1/media/download-url/<key>?expires=3600
```

The Android client should keep the canonical `key` and call
`/media/download-url` when displaying private images so links don't expire mid-screen.

## Env vars

```
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MEDIA_ENDPOINT=localhost
MEDIA_PORT=9000
MEDIA_USE_SSL=false
MEDIA_BUCKET=bagicha-media
MEDIA_PUBLIC_BASE_URL=http://localhost:9000
```

In production:
- Point `MEDIA_ENDPOINT` at the production MinIO host.
- Set `MEDIA_USE_SSL=true` and put MinIO behind TLS.
- Set `MEDIA_PUBLIC_BASE_URL` to a CDN or reverse-proxy URL so public post
  photos load via the CDN.
- Rotate `MINIO_ROOT_*` (and ideally use scoped IAM access keys per service
  rather than the root credentials).

## Local dev

Already wired into `backend/docker-compose.yml`:

```bash
cd backend
docker-compose up -d minio
```

Console at `http://localhost:9001` with `minioadmin / minioadmin`. The bucket is
created lazily by `MediaService.onModuleInit` the first time the backend boots.

## Image processing knobs

`backend/src/modules/media/media.config.ts`:

| Constant | Value | Why |
|---|---|---|
| `IMAGE_MAX_DIMENSION` | 2048 | Plant photos read fine at this size; halves storage vs. 4K |
| `IMAGE_QUALITY` | 82 | Sweet spot for mozjpeg; visually transparent for plant subjects |
| `MAX_UPLOAD_BYTES` | 8 MB | Rejects raw DSLR shots; mobile JPEGs are well under |

## What's not done yet

- **Lifecycle / orphan cleanup**: nothing prunes images whose parent row
  (`Post.image_urls`, `Plant.journal_entries.metadata`, etc.) was deleted.
  Cron job for this lives in a future slice.
- **Per-user quota**: no enforcement of total bytes per user.
- **Virus / content scan**: not implemented; relies on Sharp rejecting malformed
  inputs.
- **Multi-resolution variants**: a single processed JPEG is stored. If a
  thumbnail strip is needed later, add a `thumbs/` sibling key in MediaService.
