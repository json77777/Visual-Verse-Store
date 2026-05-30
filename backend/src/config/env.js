import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT,
  NODE_ENV:process.env.NODE_ENV,
  MONGODB_URI:process.env.MONGODB_URI,
  CORS_ORIGIN:process.env.CORS_ORIGIN,

  ACCESS_TOKEN_SECRET:process.env.ACCESS_TOKEN_SECRET,
  // expiry can be a string like '1h' or a number of seconds
  ACCESS_TOKEN_EXPIRY:process.env.ACCESS_TOKEN_EXPIRY || '1h',
  REFRESH_TOKEN_SECRET:process.env.REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRY:process.env.REFRESH_TOKEN_EXPIRY || '7d',

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  RAZORPAY_KEY_ID:process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET:process.env.RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET:process.env.RAZORPAY_WEBHOOK_SECRET,

  // Email (SendGrid)
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
  ADMIN_NOTIFICATION_EMAIL: process.env.ADMIN_NOTIFICATION_EMAIL,
  APP_URL: process.env.APP_URL

  
};
