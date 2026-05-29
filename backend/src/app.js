import cookieParser from "cookie-parser";
import express from "express"
const app = express()
import cors from "cors"
import { env } from "./config/env.js";
import { ApiError } from "./utils/ApiError.js";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// Rate Limiter: Maximum 500 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 500,
  message: { success: false, message: "Too many requests from this IP, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security Headers (disabled CORP to allow cross-origin image loading from /public)
app.use(helmet({ crossOriginResourcePolicy: false }));

// Payload Compression (Gzip)
app.use(compression());

// Apply rate limiting ONLY to API routes, not static assets
app.use("/api", apiLimiter);

// RAW BODY ONLY FOR WEBHOOKS
app.use(
  "/api/v1/webhooks",
  express.raw({ type: "application/json" })
)


app.use(cookieParser())
app.use(express.urlencoded({extended:true}))
app.use(express.static('public'))
app.use(express.json())


const parseAllowedOrigins = (value) => {
  if (!value) return [];
  if (value.trim() === "*") return ["*"];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

const allowedOrigins = parseAllowedOrigins(env.CORS_ORIGIN);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow non-browser clients (like Postman) with no Origin header.
      if (!origin) return cb(null, true);

      // "*" means allow any origin. With credentials, cors will echo the request origin.
      if (allowedOrigins.includes("*")) return cb(null, true);

      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new ApiError(403, "CORS blocked for this origin"));
    },
    credentials: true,
  })
)

// user-routes
import userRoutes from "./routes/user.route.js"
import orderRoutes from "./routes/order.route.js"
import paymentRoutes from "./routes/payment.route.js"
import webhookRoutes from "./routes/webhook.route.js"
import productRoutes from "./routes/product.router.js"
import settingRoutes from "./routes/setting.route.js"



app.use('/api/v1/users', userRoutes)
app.use('/api/v1/products',productRoutes)
app.use('/api/v1/orders', orderRoutes)
app.use('/api/v1/payments', paymentRoutes)
app.use('/api/v1/webhooks', webhookRoutes)
app.use('/api/v1/settings', settingRoutes)


// Error handler (ensures JSON errors for frontend)
app.use((err, req, res, next) => {
  if (env.NODE_ENV !== "production") {
    // Helpful for debugging 500s (multer/cloudinary/auth/etc.)
    // Avoid logging cookies/tokens; log only route + stack.
    console.error(`[API ERROR] ${req.method} ${req.originalUrl}`);
    console.error(err);
  }

  let statusCode = err?.statusCode || 500;

  // Multer errors should be client errors, not 500s.
  if (err?.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") statusCode = 413;
    else statusCode = 400;
  }

  // Heuristic: treat file type rejection as 400.
  if (
    statusCode === 500 &&
    typeof err?.message === "string" &&
    err.message.toLowerCase().includes("unsupported file type")
  ) {
    statusCode = 400;
  }

  const payload = {
    success: false,
    message: err?.message || "Internal Server Error",
    errors: err?.errors || [],
  };

  if (env.NODE_ENV !== "production") {
    payload.stack = err?.stack;
  }

  return res.status(statusCode).json(payload);
})


export default app;