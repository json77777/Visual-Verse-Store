AUTH
├── register
├── login
├── logout
├── refresh
├── getMe
├── updateProfile
├── changePassword
├── deleteAccount -- disable(soft delete)
├── getUserOrders 
├── getUserDownloads 
<!-- Admin roles -->
├── adminGetALlOrders,
├── adminGetAllPayments,
├── adminGetAllUsers
├── adminGetAllUsers
├── promoteUserToAdmin
├── demoteAdminToUser



PRODUCT
├── createProduct
├── getAllProducts
├── getProductById
├── updateProduct
├── deactivateProduct

ORDER
├── createOrder
├── getOrderById
├── getMyOrders
├── updateOrderStatus

PAYMENT
├── createRazorpayOrder
├── verifyRazorpayPayment
├── createStripeIntent
├── stripeWebhook

DOWNLOAD
├── getDownloadLink


## Razorpay – Industry-Standard Payment Flow
Frontend → Create Order (Razorpay)
Frontend → User pays
Razorpay → Webhook → Backend
Backend → Verify signature
Backend → Update Payment + Order
Backend → Unlock downloads

## FULL MONEY FLOW (END-TO-END)
1. User clicks "Pay"
   ↓
2. POST /payments/razorpay/create-order
   ↓
3. payment.controller.js
   ↓
4. Razorpay Order created
   ↓
5. Frontend opens Razorpay Checkout
   ↓
6. Payment succeeds
   ↓
7. Razorpay sends webhook
   ↓
8. POST /webhooks/razorpay
   ↓
9. razorpayWebhook.controller.js
   ↓
10. Order marked completed
   ↓
11. User hits /users/me/downloads
   ↓
12. user.controller.js returns products







##  Ngrok (Why it is used)

Ngrok is used in this project to test payment webhooks (Razorpay / Stripe) during local development.

### Problem
Payment gateways need to send webhook events (payment success, failure, refunds) to a backend server. During development, the backend runs on `localhost`, which is not accessible from the internet, so external services cannot reach it.

### Solution
Ngrok creates a secure public HTTPS URL that tunnels requests to the local server.

Example:
https://abcd-1234.ngrok-free.app → http://localhost:8000

This allows payment gateways to send webhook events to the local backend exactly as they would in production.

### Usage in this project
1. Backend runs locally on port 8000
2. Ngrok exposes the backend using:
   ngrok http 8000
3. The generated HTTPS URL is configured in Razorpay and Stripe webhook settings
4. Webhook events hit:
   /api/v1/webhooks/razorpay
   /api/v1/webhooks/stripe
5. The backend verifies webhook signatures and updates orders, payments, and user download access

### Why it matters
Ngrok enables secure, real-world testing of payment flows, prevents fake payment confirmations, and ensures the development environment closely matches production behavior.
