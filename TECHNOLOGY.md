# Technology Notes (Living Doc)

This file is the shared place to track **what technology we are implementing** in this project, why we chose it, and where it lives in the codebase.

## How we’ll use this file (from now on)

When we decide to implement something new (library/service/pattern), add a short entry under **Planned / In Progress** first, then move it to **Implemented** once it’s merged and working.

For each entry, include:
- **What**: tech/tool/pattern name
- **Why**: 1–3 bullets (problem it solves)
- **Scope**: where it’s used (frontend/backend/both)
- **Status**: planned | in-progress | implemented
- **Notes**: any setup/env vars, pitfalls, or links to relevant files

---

## Current Stack (Implemented)

### Frontend
- **Next.js (App Router) + React**
  - Location: `frontend/src/app/**`
- **TypeScript**
  - Location: `frontend/**` (TS/TSX)
- **Tailwind CSS**
  - Location: `frontend/src/app/globals.css` and Tailwind utilities across components
- **API client utilities (fetch + XHR for upload)**
  - Location: `frontend/src/lib/api.ts`

### Backend
- **Node.js + Express**
  - Location: `backend/src/app.js`, `backend/src/index.js`
- **MongoDB + Mongoose**
  - Location: `backend/src/db/**`, `backend/src/models/**`
- **File upload: Multer**
  - Location: `backend/src/middleware/multer.middleware.js`
- **Media storage: Cloudinary**
  - Location: `backend/src/utils/cloudinary.js`, `backend/src/utils/cloudinary.FILE.js`

### Security & Performance
- **express-rate-limit**
  - Location: `backend/src/app.js`
- **helmet**
  - Location: `backend/src/app.js`
- **compression**
  - Location: `backend/src/app.js`

### Payments
- **Razorpay**
  - Location: `backend/src/utils/razorpay.js`, webhook controllers
- **Stripe**
  - Location: webhook controllers

---

## Optimization Algorithms & System Design (Implemented)

To ensure the backend scales efficiently for heavy users on a given runtime, the following architectural optimizations have been implemented:

1. **Network Payload Optimization (Gzip Compression)**
   - **What**: `compression` middleware in Express.
   - **Why**: Compresses JSON payloads before sending them over the network, drastically reducing bandwidth overhead and speeding up client response times.

2. **DDoS Protection & Traffic Control (Rate Limiting)**
   - **What**: `express-rate-limit` configured to 500 requests per 15 minutes for `/api` routes.
   - **Why**: Prevents brute-force attacks and abuse by restricting the volume of requests a single IP can make, ensuring stable runtime performance for legitimate users.

3. **Database Connection Pooling**
   - **What**: Configured Mongoose with `maxPoolSize: 100` and `serverSelectionTimeoutMS: 5000` in `backend/src/db/index.js`.
   - **Why**: Maintains up to 100 open sockets to MongoDB, allowing instantaneous handling of concurrent user requests without the bottleneck of establishing new database connections.

4. **B-Tree Database Indexing**
   - **What**: Added strategic compound and single field indexes to `Product` and `Order` schemas (e.g., `{ isActive: 1, category: 1 }`).
   - **Why**: Converts O(N) Collection Scans into O(log N) B-Tree Traversals. This exponentially speeds up read operations when users are filtering products or checking order status.

5. **Query Memory Optimization**
   - **What**: Appended `.lean()` to heavy read-only Mongoose queries (e.g., `backend/src/controllers/product.controllers.js`).
   - **Why**: Instructs Mongoose to bypass hydrating heavy document instances, returning raw JSON instead. This reduces CPU and memory overhead per query by up to 5x.

---

## Recently Implemented (Highlights)

- **Admin upload real-time progress (client + server)**
  - **What**: Client-side upload progress + server-side processing updates via SSE
  - **Why**: Browser upload % alone finishes before server/Cloudinary processing
  - **Scope**: Admin upload page + backend product create endpoint
  - **Status**: implemented
  - **Notes**:
    - Frontend uses XHR progress for the multipart request.
    - Backend exposes an SSE endpoint to stream server-side status.

---

## Planned / In Progress

(Add new items here as we decide to implement them.)

- **(planned)** Transactional Email (receipts + download links) — **SendGrid (Single Sender Verification)**
  - **Why**: works without a custom domain; reliable for ~100 emails/day; easy Node integration
  - **Scope**: backend (send email after payment success), frontend (optional “resend receipt” UI later)
  - **Notes**:
    - Start with SendGrid “Single Sender Verification” so you can send from a verified personal inbox.
    - Later upgrade to a custom domain (best deliverability + branding).
    - Download links should be **short-lived** (token or signed URL) — don’t email permanent storage URLs.

Example format:
- **(planned)** Sentry (error monitoring)
  - Why: production visibility
  - Scope: frontend + backend
  - Notes: env vars, release versioning
