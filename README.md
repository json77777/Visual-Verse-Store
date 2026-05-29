# Visual Verse Store

A marketplace for digital assets — video overlays, LUTs, editor tools. Built this for a specific use case: letting creators sell downloadable files without the usual headaches of Gumroad-style platforms eating into margins.

Stack is Next.js (App Router) on the front, Express + MongoDB on the back, payments through Razorpay. If you're reading this to get it running or understand how it works, this doc covers all of that.

---

## How it's structured

```
frontend/   → Next.js App Router
backend/    → Express + Mongoose
```

Frontend prerenders where it can, falls back to client components when hooks are involved. Backend is straightforward — controllers, routes, middleware, utils. Nothing exotic.

MongoDB Atlas for data. Cloudinary for asset storage (both public images and authenticated download files). Razorpay handles paid checkouts; free products skip it entirely.

---

## Frontend — what actually matters

**`src/app/layout.tsx`** — Root layout. Wraps everything in `SmoothScroll`, which uses `useSearchParams()`. Had to wrap that in `React.Suspense` because Next.js throws a prerender error otherwise. Took a bit to figure out, worth knowing upfront.

**`src/app/admin/upload/page.tsx`** and **`src/app/admin/edit/[productId]/page.tsx`** — Admin upload and edit pages. Both have an `isFree` toggle. When toggled, that gets sent to the backend and skips the price entirely.

**`src/app/cart/page.tsx`** — Cart page. Reads from localStorage via `src/lib/cart.ts`. Nothing fancy, just add/remove and a checkout button.

**`src/app/checkout/page.tsx`** — This is where the interesting logic lives. It creates an order, then hits the Razorpay create-order endpoint. If the backend comes back with `amount === 0`, it skips opening Razorpay altogether, clears the cart, and sends the user to `/downloads`. Free products just... work.

**`src/lib/money.ts`** — Small helper. Returns `"Free"` when price is zero paise.

---

## Backend — what actually matters

**`src/app.js`** — App setup, route wiring, middleware registration.

**`src/index.js`** — DB connection, server start. Reads config from env.

**`src/controllers/`** — Separate controllers for products, orders, payments, users, and webhooks. Each does one thing.

**`src/routes/payment.route.js`** — Has `POST /razorpay/create-order` and `POST /razorpay/verify`. Both require a valid JWT. Don't forget this when testing — unauthenticated requests will just 401.

**`src/utils/`** — `ApiError`, `ApiResponse`, `asyncHandler`, email sender, Cloudinary helpers. The usual.

The thing worth calling out: `createRazorpayOrder` now checks if `totalAmount === 0` before doing anything with Razorpay. If it's zero, it marks the order as paid, fires off the confirmation emails, and returns early. No Razorpay API call, no order ID — just `amount: 0` and `razorpayOrderId: null`. The frontend handles the rest.

---

## Data models (quick reference)

`Product` — title, description, price (stored in paise), images, isDigital, downloadUrl (cloudinary format: `"resourceType:publicId"`), stock, isActive, isFree.

`Order` — user ref, items array (product, quantity, priceAtPurchase), totalAmount, paymentProvider, paymentStatus, orderStatus.

`Payment` — provider-specific details, verification status.

---

## How the checkout flows work

**Paid product:**

1. Frontend POSTs to `/api/v1/orders` (needs JWT in cookie or Authorization header)
2. Frontend POSTs to `/api/v1/payments/razorpay/create-order`
3. Backend creates a Razorpay order, returns amount + key + razorpayOrderId
4. Frontend loads the Razorpay SDK, opens checkout
5. On success, frontend hits `/api/v1/payments/razorpay/verify`

**Free product:**

1. Same order creation step
2. Same Razorpay endpoint — but backend detects zero amount and shortcuts
3. Order gets marked paid + completed, emails go out, backend returns `amount: 0`
4. Frontend sees the zero, skips Razorpay entirely, clears cart, redirects to `/downloads`

---

## Admin uploads

Products are created through the admin upload flow. Images go to Cloudinary normally. The actual downloadable file uses an authenticated upload path — the `downloadUrl` field stores it as `"resourceType:publicId"` so the backend can generate signed, short-lived URLs at download time.

Upload progress surfaces in the UI via SSE — there's a `uploadProgressStore.js` that handles that.

---

## Running locally

Backend:

```bash
cd backend
npm install
npm start
```

Frontend:

```bash
cd frontend
npm install
npm run build
PORT=3001 npm start
# or just: npm run dev
```

Quick sanity checks once both are up:

- `GET http://localhost:8000/api/v1/products` should return your products
- Add a free product to cart → checkout → should skip Razorpay and land on `/downloads`
- For a paid product, Razorpay checkout should open normally

---

## Deploying (Vercel + Render)

Two separate projects. Frontend goes on Vercel pointed at `frontend/`. Backend goes on Render pointed at `backend/`.

Things to not forget:

- Set `CORS_ORIGIN` on the backend to your Vercel domain
- Set `NEXT_PUBLIC_API_BASE_URL` on the frontend to your Render URL
- Backend start command: `npm start` — there's a no-op build script so CI doesn't complain
- If you're using Razorpay webhooks, register the URL in your Razorpay dashboard and set `RAZORPAY_WEBHOOK_SECRET`

---

## Environment variables

Create `backend/.env`:

```
PORT=8000
NODE_ENV=production
MONGODB_URI=your_mongodb_atlas_uri
CORS_ORIGIN=https://your-app.vercel.app

ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

SENDGRID_API_KEY=
EMAIL_FROM="Your Store <no-reply@yourdomain.com>"
SUPPORT_EMAIL=
ADMIN_NOTIFICATION_EMAIL=
APP_URL=https://your-frontend-url
```

---

## Do I need to push to GitHub before deploying?

Short answer: only if you're deploying from GitHub (auto-deploy on push). If you're using the Vercel or Render CLI directly from your machine, you don't need to push first.

That said — just push. It takes 30 seconds and you'll thank yourself later when you need to roll back or hand this off to someone.

---

## What's left / known rough edges

- `isFree` is added to the backend Product model and frontend TypeScript type, but double-check that everywhere it's consumed handles the `undefined` case — older product records won't have it.
- No CI yet. A simple GitHub Actions workflow running `npm ci && npm run build` in both directories would catch regressions early.
- The free-vs-paid checkout logic has no integration tests. Manual testing works but this is fragile if someone touches the payment controller.
- Worth adding a `DEPLOYMENT.md` with step-by-step Render + Vercel setup for anyone deploying fresh.