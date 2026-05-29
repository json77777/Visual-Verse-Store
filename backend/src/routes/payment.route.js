import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
	createRazorpayOrder,
	verifyRazorpayPayment,
} from "../controllers/payment.controller.js";

const router = Router()


router.route('/razorpay/create-order')
.post(verifyJWT, createRazorpayOrder)

router.route('/razorpay/verify')
.post(verifyJWT, verifyRazorpayPayment)

export default router