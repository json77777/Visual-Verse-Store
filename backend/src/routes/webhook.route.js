import { Router } from "express"
import { razorpayWebhook } from "../controllers/razorpayWebhook.controller.js"

const router = Router()

router.post("/razorpay", razorpayWebhook)
// router.post("/stripe", stripeWebhook)

export default router