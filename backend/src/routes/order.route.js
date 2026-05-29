import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { createOrder } from "../controllers/order.controller.js";

const router = Router()

router.route('/').post(verifyJWT, createOrder)

export default router