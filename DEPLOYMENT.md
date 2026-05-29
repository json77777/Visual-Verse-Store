# Deployment Guide — Vercel (Frontend) + Render (Backend)

This document describes a straightforward deployment flow for the Visual Verse Store using Vercel for the frontend (`frontend/`) and Render (or similar) for the backend (`backend/`). It assumes you have a GitHub repo and will deploy from the repo. Manual/local deploys are possible with the `vercel` CLI or Render's manual deploy UI.

1) Prepare repository

- Ensure code is pushed to GitHub. If you prefer local deploys, you can skip pushing, but pushing is recommended for reproducible builds.
- Confirm `frontend/` builds (`npm run build`) and `backend/` starts (`npm start`) locally.

2) Create backend service (Render example)

- On Render, create a new Web Service and connect to your GitHub repository pointing to the `backend/` folder.
- Build command: leave blank (Node app) or `npm run build` if you add a build step.
- Start command: `npm start`
- Instance: choose a free or starter instance depending on traffic.
- Environment variables: add the values from `backend/.env.example` as secrets on Render (do NOT commit real secrets to the repo). Important:
  - `MONGODB_URI` — MongoDB connection string
  - `CLOUDINARY_*`, `RAZORPAY_*`, `SENDGRID_API_KEY`, `EMAIL_FROM`, `APP_URL`, JWT secrets
- If you have webhooks (Razorpay), add the webhook URL in Razorpay dashboard: `https://<your-backend>.onrender.com/api/v1/payments/razorpay/webhook` and set `RAZORPAY_WEBHOOK_SECRET` accordingly.

3) Create frontend project (Vercel)

- On Vercel, create a new project and import your GitHub repository, selecting the `frontend/` subdirectory.
- Framework Preset: Next.js
- Build command: `npm run build`
- Output directory: (leave default for Next.js)
- Environment variables on Vercel:
  - `NEXT_PUBLIC_API_BASE_URL` = `https://<your-backend-domain>` (Render service URL)
  - Any other public keys needed
- Add CORS origin on backend: set `CORS_ORIGIN` to your Vercel domain.

4) DNS & Domains (optional)

- Add custom domains on Vercel + Render as needed and update `APP_URL` in backend envs.

5) Testing in production

- Visit frontend URL: verify homepage, product pages, cart and checkout.
- Test a paid checkout (use Razorpay test keys) and verify webhooks/verify endpoint works.
- Test a free checkout: create a product with `isFree = true` and verify the frontend receives `amount: 0` and skips Razorpay.

6) CI / Automation (recommended)

- Add GitHub Actions workflow to run frontend build and backend lint/build on push to main. Example:

```yaml
name: CI
on: [push]
jobs:
  build-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Use Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Build frontend
        working-directory: frontend
        run: |
          npm ci
          npm run build

  build-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Use Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install backend
        working-directory: backend
        run: |
          npm ci
          npm run build || true

```

7) Security & operational notes

- Keep secrets out of the repo; use the platform's secret store (Vercel Environment Variables, Render Secrets).
- Enable HTTPS (Vercel/Render provide this automatically for their domains).
- Set up monitoring/alerts (Render health checks, Sentry/LogRocket for frontend errors).

8) Rollback & testing

- Use Vercel/Render's deployment history to rollback to a previous deployment if necessary.

If you want, I can create a GitHub Actions workflow file and push these docs and the `.env.example` for you. Since you said you'll push them, I added the files locally — tell me when you've pushed or if you'd like me to push them for you.
