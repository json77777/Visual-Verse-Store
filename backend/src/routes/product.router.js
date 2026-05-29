import { Router } from "express";
import { adminCreateProduct, adminGetProduct, adminListProducts, adminRemoveProduct, adminReplaceDigitalFile, adminToggleProductStatus, adminUpdateProduct, adminUploadCoverImage, adminUploadStatusSSE, getAllActiveProducts, getProductCategories, getSingleProduct } from "../controllers/product.controllers.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/admin.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router()


// Get all active products
router.route('/').get(getAllActiveProducts)

// Get distinct categories for active products
router.route('/categories').get(getProductCategories)


// admin routes
// create product

router.route('/admin/upload-status/:jobId')
.get(verifyJWT, isAdmin, adminUploadStatusSSE)

router.route('/admin/create')
.post(
    verifyJWT,
    isAdmin,
    upload.fields([
        {name:'images',maxCount:5},
        {name:'file',maxCount:1},
    ]),
    adminCreateProduct
)

// update product
router.route("/admin/update/:productId")
.patch(verifyJWT,isAdmin,adminUpdateProduct)


// replace digital asset file
router.route("/admin/replace-file/:productId")
.patch(verifyJWT, isAdmin, upload.single("file"), adminReplaceDigitalFile)


// upload/replace cover image
router.route("/admin/cover-image/:productId")
.patch(verifyJWT, isAdmin, upload.single("image"), adminUploadCoverImage)


// remove product
router.route("/admin/remove/:productId")
.patch(verifyJWT, isAdmin, adminRemoveProduct)


// toogle product active or not
router.route("/admin/toggle-status/:productId")
.patch(verifyJWT,isAdmin,adminToggleProductStatus)


// admin: list products (including inactive)
router.route("/admin/all")
.get(verifyJWT, isAdmin, adminListProducts)


// admin: get product (including inactive)
router.route("/admin/:productId")
.get(verifyJWT, isAdmin, adminGetProduct)


// get single product (keep this AFTER /admin routes)
router.route('/:productId').get(getSingleProduct)


export default router
