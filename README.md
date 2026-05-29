# Visual Verse Store — A Developer's Blog & Project Overview

Visual Verse Store is a full-stack marketplace for digital assets, plugins, and editor-focused tools — built by editors, for editors. This repository contains the frontend (Next.js App Router) and backend (Express + MongoDB) that power an editorial asset store with digital downloads, admin upload workflows, and integrated payments (Razorpay).

This README is written as a concise developer-focused blog to explain every corner of the project: architecture, key modules, data flow, deployment notes, and testing/checklist you can follow before hosting.

---

## Table of Contents
- Project Summary
- Architecture Overview
- Frontend (Next.js) — important files & flows
- Backend (Node/Express) — important files & flows
- Data models
- Payments and free-product flow
- Admin / Upload process
- Local development & verification steps
- Deployment checklist (Vercel + Render recommended)
- Environment variables (`.env.example`)
- FAQ: Do I need to push docs to GitHub before hosting?
- Next steps & recommended improvements

---

## Project Summary

Visual Verse Store is intended to let creators sell downloadable digital goods (video overlays, LUTs, templates). It supports:
- Admin upload/edit of products including digital file uploads (Cloudinary authenticated assets).
- Digital downloads that require a purchase (or are marked free) and receive a signed short-lived URL on download.
- Payments via Razorpay with webhooks to verify transactions.
- Free products that bypass payment and immediately produce downloads (and still send receipt emails).

The codebase is split into two top-level folders: `frontend/` and `backend/`.

## Architecture Overview

- Frontend: Next.js (App Router) using server and client components, Tailwind CSS, and small client-side utilities. Built to prerender pages where possible and use client hooks when necessary.
- Backend: Express.js, Mongoose for MongoDB, structured controllers, middleware for auth and file uploads, and utilities for sending emails and cloud uploads.
- Data: MongoDB (Atlas) stores `Product`, `User`, `Order`, `Payment`, `Setting` and related models.
- Payments: Razorpay SDK on backend; frontend opens Razorpay checkout for paid orders. Backend handles zero-amount orders specially (marks paid and completes order without calling Razorpay).

## Frontend (Next.js) — Key Files & Flows

- `src/app/layout.tsx` — Root layout, global fonts, and `SmoothScroll` wrapper. Note: `SmoothScroll` uses `useSearchParams()` and must be wrapped in `React.Suspense` to avoid build-time CSR bailout errors.
- `src/app/admin/upload/page.tsx` and `src/app/admin/edit/[productId]/page.tsx` — Admin pages for creating and updating products. They include an `isFree` toggle to mark products free and will send that value to the backend.
- `src/app/cart/page.tsx` — Cart UI, removal actions, and Checkout button (uses Syne font). Uses `frontend/src/lib/cart.ts` helper for local storage cart operations.
- `src/app/checkout/page.tsx` — Checkout flow: creates an internal `Order` via `/api/v1/orders`, then requests `/api/v1/payments/razorpay/create-order`. If backend returns `amount === 0`, the frontend skips Razorpay and completes the order locally (clears cart + redirect to `/downloads`).
- `src/lib/money.ts` — Display helpers; returns `"Free"` for zero-paise prices.

Build notes: Next.js pages that use `next/navigation` hooks (e.g., `useSearchParams`) must be either client components or wrapped in Suspense when used inside a server component tree. During recent verification, `useSearchParams` in `SmoothScroll` caused a prerender error until wrapped in `React.Suspense`.

## Backend (Express) — Key Files & Flows

- `src/app.js` — Express app wiring, route registration and middleware.
- `src/index.js` — DB connection and server start using `env` for configuration.
- `src/controllers/*` — Controllers for `product`, `order`, `payment`, `user`, and webhook handlers.
- `src/routes/*` — Route definitions; `payment.route.js` includes `POST /razorpay/create-order` and `POST /razorpay/verify` and both are protected with JWT.
- `src/utils/*` — Helpers: `ApiError`, `ApiResponse`, `asyncHandler`, `email`, `cloudinary`, etc.

Important behavior implemented recently:
- `createRazorpayOrder` detects orders with `totalAmount === 0` and marks them completed without contacting Razorpay. This avoids unnecessary Razorpay calls and lets free items bypass payment while still recording an order and sending emails.

## Data Models (high-level)

- `Product` — `title`, `description`, `price` (paise), `images`, `isDigital`, `downloadUrl` (cloudinary), `stock`, `isActive`, and `isFree` (new boolean). `isFree` allows products to be sold for free and skips payment.
- `Order` — `user`, `items` (product, qty, priceAtPurchase), `totalAmount`, `paymentProvider`, `paymentStatus`, `orderStatus`.
- `Payment` — stores payment provider details and verification status.

## Payments and Free-Product Flow

Normal paid flow:
1. Frontend creates an `Order` via `/api/v1/orders` (protected route, requires JWT via cookies or Authorization header).
2. Frontend calls `/api/v1/payments/razorpay/create-order` which creates a Razorpay order and returns `amount`, `currency`, `key` and `razorpayOrderId`.
3. Frontend loads the Razorpay SDK and opens checkout; on success it calls `/api/v1/payments/razorpay/verify` to finalize.

Free-product flow (implemented):
1. Frontend creates `Order` as usual (items with price 0 if product `isFree`).
2. When creating Razorpay order, backend detects `totalAmount === 0`, marks the order `paid` / `completed`, sends emails (customer + admin), and returns `amount: 0` and `razorpayOrderId: null`.
3. Frontend sees `amount === 0` and skips Razorpay UI — clears cart and redirects user to `/downloads`.

## Admin / Upload Process

- Admin uploads images and digital assets in `adminUploadProduct` flow. Images are uploaded to Cloudinary, digital files use an authenticated upload path; the product stores `downloadUrl` as `"<resourceType>:<publicId>"`.
- Upload progress is streamed via an SSE-based job progress store (`uploadProgressStore.js`) to surface progress in the UI.

## Local Development & Verification Steps

1. Start backend:

```powershell
cd backend
npm install
npm start
```

2. Start frontend (production build or dev):

```powershell
cd frontend
npm install
npm run build    # one-time
PORT=3001 npm start  # start on alternate port if 3000 is in use
# or for development
npm run dev
```

3. Verify endpoints:
- GET `http://localhost:8000/api/v1/products`
- Create an order (requires authentication) and verify `/api/v1/payments/razorpay/create-order` returns `amount: 0` for free orders.

4. Test free-order flow in the UI: add a free product to the cart, checkout — the app should skip Razorpay and redirect to `/downloads`.

## Deployment checklist (Vercel frontend + Render backend)

1. Create two projects: Frontend (Vercel) pointing to `frontend/`, Backend (Render or similar) pointing to `backend/`.
2. Add environment variables on both platforms (see `.env.example` section below).
3. Set backend start command: `npm start`. (We added a no-op `npm run build` so CI won't fail.)
4. Configure CORS on backend (`CORS_ORIGIN`) to allow Vercel's domain.
5. Configure `NEXT_PUBLIC_API_BASE_URL` in frontend environment to point to the backend URL.
6. If using webhooks (Razorpay), register the webhook URL in your Razorpay dashboard and set `RAZORPAY_WEBHOOK_SECRET`.

## `.env.example` (required variables)

Create an `.env` in `backend/` with values similar to:

```
PORT=8000
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
CORS_ORIGIN=https://your-vercel-domain.vercel.app

ACCESS_TOKEN_SECRET=...(jwt secret)...
REFRESH_TOKEN_SECRET=...(jwt refresh secret)...

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

SENDGRID_API_KEY=...
EMAIL_FROM="Your Store <no-reply@yourdomain.com>"
SUPPORT_EMAIL=...
ADMIN_NOTIFICATION_EMAIL=...
APP_URL=https://your-frontend-url
```

## FAQ: Do I need to push docs to GitHub before hosting?

Short answer: No, it's not strictly required — hosting platforms like Vercel / Render build from your repository. If you plan to deploy from GitHub (automatic deployments on push or PR), then pushing your code (including updated docs) to the remote is necessary so the platform can access the latest code.

Options:
- If you are deploying directly from your local machine (e.g., using `vercel` CLI or Render's manual deploy), you can deploy without pushing docs first.
- If you want reproducible, auditable deployments and CI checks, push your code and docs to GitHub and enable auto-deploy on push; this is recommended.

Recommendation: push code (and docs) to GitHub before creating production deployments. Updated docs help reviewers and future-you understand the deployment configuration and are a tiny step toward good operational hygiene.

## Next Steps & Recommendations

- Add `isFree` to the `Product` TypeScript type in the frontend (done) and ensure other areas use it defensively.
- Add a lightweight CI workflow (GitHub Actions) to run `cd frontend && npm ci && npm run build` and `cd backend && npm ci && npm run build` to catch build regressions.
- Consider adding integration tests around the checkout flow (especially free vs paid paths).
- Add an `.env.example` file (I can create it now) and a short `DEPLOYMENT.md` with step-by-step Vercel + Render instructions.

---

If you'd like, I can: (1) generate `.env.example`, (2) create `DEPLOYMENT.md` with exact steps for Vercel + Render, and (3) push these changes to GitHub for you. Tell me which of those to do next.
