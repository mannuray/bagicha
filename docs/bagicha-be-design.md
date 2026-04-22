# Bagicha - Backend (BE) Architectural Design

## 1. Technology Stack & Infrastructure
- **Framework:** NestJS (TypeScript) with **Prisma ORM**.
- **Database:** PostgreSQL for relational data; Redis for caching/real-time alerts.
- **Authentication:** **Phone Number + OTP** (Firebase Auth or Twilio).
- **Media Storage:** **Minio** (Local/S3-compatible) for development, migrating to AWS S3/GCS later.
- **Payments:** **Razorpay** for UPI, recurring subscriptions, and kit orders.
- **Vision Engine:** **Hybrid Approach** (On-device TFLite for identification; Cloud-based API for advanced disease diagnosis).
- **Task Scheduling:** BullMQ (powered by Redis) for the Seasonal Engine.

### Directory Structure:
```text
src/
├── common/              # Shared decorators, guards, filters, and interceptors
│   ├── filters/         # Global HttpExceptionFilter (Standardized Error Response)
│   └── interceptors/    # Global TransformInterceptor (Standardized Success Response)
├── prisma/              # Prisma Client module and Prisma Service
├── modules/
│   ├── auth/            # Auth & Onboarding Flow
│   ├── tree-ledger/     # CRUD for trees, legacy timelines, and logs
│   ├── seasonal/        # Weather Engine, Scheduling (BullMQ), and Alerts
│   ├── vision/          # AI Diagnosis and Plant Identification (Gemini/Plantix)
│   └── community/       # Forum, Expert Q&A, and Direct Messaging/Chat
├── main.ts              # Entry point
└── app.module.ts        # Root module (imports all feature modules)
```

## 2. API Strategy & Standards (Ecosystem Standard)

### 2.1. Success Response (Single Resource)
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Example",
    "created_at": "2026-03-21T12:00:00Z",
    "updated_at": "2026-03-21T14:30:00Z"
  },
  "request_id": "req_a1b2c3d4e5f6",
  "timestamp": "2026-03-21T14:30:00Z"
}
```

### 2.2. Success Response (Paginated List)
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_items": 47,
    "total_pages": 3,
    "has_next": true,
    "has_previous": false
  },
  "request_id": "req_a1b2c3d4e5f6",
  "timestamp": "2026-03-21T14:30:00Z"
}
```

### 2.3. Error Response (General & Validation)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "request_id": "req_a1b2c3d4e5f6",
    "timestamp": "2026-03-21T14:30:00Z",
    "path": "/api/v1/resource",
    "details": null,
    "validation_errors": [
      { "field": "name", "message": "is required" },
      { "field": "email", "message": "must be a valid email address" }
    ]
  }
}
```

### 2.4. HTTP Status Code Mapping
- **200**: GET, PUT, PATCH success
- **201**: POST creates a resource
- **204**: DELETE success (no body)
- **400**: Malformed request
- **401**: Missing/invalid auth
- **403**: Valid auth, no permission
- **404**: Resource doesn't exist
- **409**: Conflict (duplicate, version)
- **422**: Validation failed (Unprocessable Entity)
- **429**: Rate limited
- **500**: Server error (Internal Server Error)

### 2.5. Field Rules & Naming
- **Naming:** All fields MUST use `snake_case`.
- **IDs:** Use UUID strings.
- **Dates:** ISO 8601 with timezone (UTC preferred).
- **Nullability:** Include null fields in response; do not omit.
- **Arrays:** Use `[]` for empty arrays, never `null`.
- **Error Codes:** Use `DOMAIN_DESCRIPTION` pattern (e.g., `AUTH_UNAUTHORIZED`).
- **Security:** Never leak internal stack traces or SQL errors in 500 responses.

## 3. Core Service Architecture (Updated)

### 3.1. The Tree Ledger Service (Prisma-Driven)
- Handles relational tree data.
- **The "Legacy Timeline":** Efficiently fetches nested logs (photos, notes, harvests) using Prisma's fluent API.

### 3.2. The Seasonal Engine (BullMQ + Redis)
- Background jobs fetch hyperlocal weather for all user Pincodes.
- Triggers events in the `seasonal` module to send push notifications via Firebase (FCM).

### 3.3. The AI Mentor Loop (RAG - Retrieval Augmented Generation)
- **Context:** Fetch user's tree history from `tree-ledger`.
- **Knowledge:** Fetch expert-verified community answers from `community`.
- **Synthesis:** Gemini API combines these into a zero-guesswork, localized answer.

## 4. Preliminary Schema (Prisma)
- The schema will define `User`, `Tree`, `Log`, `Task`, `Post`, `Comment`, and `Message` models with robust relations.
