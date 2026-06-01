import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import uploadAuthenticatedFile from "../utils/cloudinary.FILE.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Product } from "../models/product.model.js";
import { attachJobSse, completeJob, ensureJob, failJob, updateJob } from "../utils/uploadProgressStore.js";


function toCategoryKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}



const adminCreateProduct = asyncHandler(async (req, res) => {
  const uploadJobId = req.body?.uploadJobId ? String(req.body.uploadJobId) : null;
  if (uploadJobId) ensureJob(uploadJobId);

  console.log("FILES RECEIVED:", req.files);
  console.log("BODY:", req.body);
  console.log("FILES:", req.files);

  const { title, description, price, isDigital, stock, category } = req.body;
  // `isFree` may be sent as string "true" from multipart/form-data forms
  const isFree = req.body?.isFree === "true" || req.body?.isFree === true || false;

  if (!title || !description || !price) {
    if (uploadJobId) failJob(uploadJobId, "Missing required fields");
    throw new ApiError(400, "Title, description and price are required");
  }

  //   NORMALIZE isDigital ONCE
  const isDigitalProduct = isDigital === "true";

  const categoryKey = toCategoryKey(category) || "colour-preset";

  if (uploadJobId) {
    updateJob(uploadJobId, {
      phase: "validating",
      percent: 2,
      message: "Validated fields",
    });
  }

  // Upload product images
  const imageUrls = [];

  if (req.files?.images?.length) {
    const count = req.files.images.length;
    if (uploadJobId) {
      updateJob(uploadJobId, {
        phase: "uploading_images",
        percent: 5,
        message: `Uploading ${count} image${count === 1 ? "" : "s"}…`,
      });
    }

    for (const file of req.files.images) {
      const uploaded = await uploadOnCloudinary(file.path);

      if (!uploaded?.secure_url) {
        throw new ApiError(500, "Image upload failed");
      }

      imageUrls.push(uploaded.secure_url);

      if (uploadJobId) {
        const doneCount = imageUrls.length;
        const pct = 5 + Math.round((doneCount / count) * 20); // 5 → 25
        updateJob(uploadJobId, {
          phase: "uploading_images",
          percent: pct,
          message: `Uploaded image ${doneCount}/${count}`,
        });
      }
    }
  }

  // Upload digital file (only if digital)
  let downloadPublicId = null;

  if (isDigitalProduct) {
    if (!req.files?.file?.length) {
      if (uploadJobId) failJob(uploadJobId, "Digital file is required");
      throw new ApiError(400, "Digital product file is required");
    }

    if (uploadJobId) {
      updateJob(uploadJobId, {
        phase: "uploading_file",
        percent: 30,
        message: "Uploading digital file…",
      });
    }

    const uploadedFile = await uploadAuthenticatedFile(req.files.file[0].path, {
      onProgress: uploadJobId
        ? ({ percent }) => {
            // map 0-100 to 30-90
            const mapped = 30 + Math.round(((percent ?? 0) / 100) * 60);
            updateJob(uploadJobId, {
              phase: "uploading_file",
              percent: Math.min(90, Math.max(30, mapped)),
              message: `Uploading digital file… ${percent ?? 0}%`,
            });
          }
        : null,
    });

    if (!uploadedFile?.public_id) {
      if (uploadJobId) failJob(uploadJobId, "Digital file upload failed");
      throw new ApiError(500, "Digital file upload failed");
    }

    // Store as "resourceType:publicId" to support mp4 (video) downloads.
    // Backward compatible: existing values without a prefix are treated as raw.
    downloadPublicId = `${uploadedFile.resource_type || "raw"}:${uploadedFile.public_id}`;

    if (uploadJobId) {
      updateJob(uploadJobId, {
        phase: "uploading_file",
        percent: 92,
        message: "Digital file uploaded",
      });
    }
  }

  // Create product
  if (uploadJobId) {
    updateJob(uploadJobId, {
      phase: "saving",
      percent: 96,
      message: "Saving product…",
    });
  }

  const product = await Product.create({
    title,
    category: categoryKey,
    description,
    price,
    images: imageUrls,
    owner: req.user._id,
    isDigital: isDigitalProduct,
    isFree,
    downloadUrl: downloadPublicId,
    stock: isDigitalProduct ? 1 : stock ?? 1,
    isActive: true,
  });

  if (uploadJobId) completeJob(uploadJobId, "Product created");

  return res.status(201).json(
    new ApiResponse(
      201,
      product,
      "Product created successfully"
    )
  );
});

const adminUploadStatusSSE = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  if (!jobId) {
    throw new ApiError(400, "jobId is required");
  }

  attachJobSse(String(jobId), req, res);
});


// update product
const adminUpdateProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params

  const product = await Product.findById(productId)
  if (!product) {
    throw new ApiError(404, "Product not found")
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    { $set: req.body },
    { new: true, runValidators: true }
  )

  return res.status(200).json(
    new ApiResponse(200, updatedProduct, "Product updated successfully")
  )
})


// admin: replace digital asset file (Cloudinary authenticated)
const adminReplaceDigitalFile = asyncHandler(async (req, res) => {
  const { productId } = req.params

  const product = await Product.findById(productId)
  if (!product) {
    throw new ApiError(404, "Product not found")
  }

  if (!product.isDigital) {
    throw new ApiError(400, "This product is not a digital asset")
  }

  if (!req.file?.path) {
    throw new ApiError(400, "Digital product file is required")
  }

  const uploadedFile = await uploadAuthenticatedFile(req.file.path)
  if (!uploadedFile?.public_id) {
    throw new ApiError(500, "Digital file upload failed")
  }

  product.downloadUrl = `${uploadedFile.resource_type || "raw"}:${uploadedFile.public_id}`
  await product.save()

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Digital file replaced successfully"))
})


// admin: add/replace cover image (Cloudinary image)
const adminUploadCoverImage = asyncHandler(async (req, res) => {
  const { productId } = req.params

  const product = await Product.findById(productId)
  if (!product) {
    throw new ApiError(404, "Product not found")
  }

  if (!req.file?.path) {
    throw new ApiError(400, "Cover image file is required")
  }

  const uploaded = await uploadOnCloudinary(req.file.path)
  if (!uploaded?.secure_url) {
    throw new ApiError(500, "Image upload failed")
  }

  const nextUrl = uploaded.secure_url
  const existing = Array.isArray(product.images) ? product.images : []
  const withoutDupes = existing.filter((u) => u && u !== nextUrl)

  // Keep max 5 images to match create flow.
  let nextImages
  if (withoutDupes.length >= 5) {
    nextImages = [nextUrl, ...withoutDupes.slice(1, 5)]
  } else {
    nextImages = [nextUrl, ...withoutDupes].slice(0, 5)
  }

  product.images = nextImages
  await product.save()

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Cover image updated successfully"))
})


// toggle active or deactive product
const adminToggleProductStatus = asyncHandler(async(req,res)=>{
    const {productId} = req.params

    const product = await Product.findById(productId) 
    if (!product) {
    throw new ApiError(404, "Product not found")
    }

    // toggle
    product.isActive = !product.isActive
    await product.save()

    return res.status(200).json(
        new ApiResponse(
        200,
        product,
        `Product ${product.isActive ? "activated" : "deactivated"}`
        )
    )
})

// all activeproducts
const getAllActiveProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isActive: true }).sort({ createdAt: -1 }).lean()

  return res.status(200).json(
    new ApiResponse(200, products, "Products fetched successfully")
  )
})


// list distinct product categories (active products)
const getProductCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct("category", { isActive: true })

  const normalized = (categories ?? [])
    .map((c) => toCategoryKey(c))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))

  return res
    .status(200)
    .json(new ApiResponse(200, normalized, "Categories fetched successfully"))
})


// singleProduct
const getSingleProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params

  const product = await Product.findOne({
    _id: productId,
    isActive: true,
  })

  if (!product) {
    throw new ApiError(404, "Product not found")
  }

  return res.status(200).json(
    new ApiResponse(200, product, "Product fetched successfully")
  )
})


// admin: get product (including inactive)
const adminGetProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params

  const product = await Product.findById(productId)
  if (!product) {
    throw new ApiError(404, "Product not found")
  }

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product fetched successfully"))
})


// admin: list all products (including inactive)
const adminListProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({}).sort({ createdAt: -1 }).lean()
  return res
    .status(200)
    .json(new ApiResponse(200, products, "Products fetched successfully"))
})


// removeProduct
const adminRemoveProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params

  const product = await Product.findById(productId)
  if (!product) {
    throw new ApiError(404, "Product not found")
  }

  product.isActive = false
  await product.save()

  return res.status(200).json(
    new ApiResponse(
      200,
      product,
      "Product removed from store successfully"
    )
  )
})

// hard delete product
const adminHardDeleteProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params

  const product = await Product.findById(productId)
  if (!product) {
    throw new ApiError(404, "Product not found")
  }

  await Product.findByIdAndDelete(productId)

  return res.status(200).json(
    new ApiResponse(
      200,
      {},
      "Product permanently deleted successfully"
    )
  )
})



export {
  adminCreateProduct,
  adminUploadStatusSSE,
  adminReplaceDigitalFile,
  adminUploadCoverImage,
  adminUpdateProduct,
  adminToggleProductStatus,
  getAllActiveProducts,
  getProductCategories,
  getSingleProduct,
  adminGetProduct,
  adminListProducts,
  adminRemoveProduct,
  adminHardDeleteProduct,
}