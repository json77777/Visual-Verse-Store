import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import { getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, changePassword, requestPasswordReset, resetPassword, deleteUserAccount, getUserOrders, getUserDownloads, downloadPurchasedAsset, adminGetAllUsers, adminGetALlOrders, adminGetAllPayments, adminGetStats, promoteUserToAdmin, demoteAdminToUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/admin.middleware.js";

const router = Router()

router.route('/register').post(
    upload.single('avatar'), // middleware
    registerUser
)

router.route('/login').post(loginUser)

router.route('/forgot-password').post(requestPasswordReset)
router.route('/reset-password/:token').post(resetPassword)

// secured-routes
router.route('/logout').post(verifyJWT, logoutUser)

router.route('/refresh-token').post(refreshAccessToken)

router.route('/current-user').get(verifyJWT,getCurrentUser)

router.route('/update-user-details')
.patch(verifyJWT, upload.single('avatar'), updateAccountDetails)

router.route('/change-password').patch(verifyJWT, changePassword)

router.route('/delete-user').post(verifyJWT,deleteUserAccount)

router.route('/orders/me').get(verifyJWT,getUserOrders)

router.route('/downloads/me').get(verifyJWT,getUserDownloads)

// Download a purchased asset (redirects to a short-lived Cloudinary URL)
router.route('/downloads/:productId').get(verifyJWT, downloadPurchasedAsset)

// admin routes
router.route('/admin/users').get(verifyJWT, isAdmin, adminGetAllUsers)

router.route('/admin/payments').get(verifyJWT, isAdmin, adminGetAllPayments)

router.route('/admin/orders').get(verifyJWT, isAdmin, adminGetALlOrders)

router.route('/admin/stats').get(verifyJWT, isAdmin, adminGetStats)

router.route('/admin/users/promote/:userId').patch(verifyJWT, isAdmin, promoteUserToAdmin
)

router.route('/admin/users/demote/:userId').patch(verifyJWT, isAdmin, demoteAdminToUser)

export default router