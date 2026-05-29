import { v2 as cloudinary } from "cloudinary"
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { env } from "../config/env.js";
import jwt from "jsonwebtoken"
import { Order } from "../models/order.model.js"
import { Payment } from "../models/payment.model.js"
import { Product } from "../models/product.model.js"
import { Visitor } from "../models/visitor.model.js"
import { getOnlineUserIds } from "./setting.controller.js"
import crypto from "crypto";
import { sendEmail, emailTemplates } from "../utils/email.js";
const getAuthCookieOptions = () => {
    // NOTE:
    // - In production with separate frontend/backend origins you typically need: sameSite: "none" and secure: true.
    // - In local dev over http, sameSite: "lax" keeps cookies working without requiring https.
    return {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get user details
    const { fullName, username, email, password } = req.body

    // validate non empty
    if (!fullName || !username || !email || !password) {
        throw new ApiError(400, 'All fields are required!')
    }

    // check for user if present or not
    const exisitingUser = await User.findOne({
        $or: [{ email }, { username }]
    })

    if (exisitingUser) {
        throw new ApiError(400, 'User already exists!')
    }

    // todo:file upload that is avatar

    // it is getting from the middleware func
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, 'Avatar image is required!')
    }

    // upload avatr image
    const avatarUpload = await uploadOnCloudinary(avatarLocalPath)
    if (!avatarUpload?.secure_url) {
        throw new ApiError(500, 'Avatar upload failed!')
    }


    // create user 
    const newUser = await User.create({
        fullName,
        username,
        email,
        password,
        avatar: avatarUpload?.secure_url
    })

    // check for user creation
    // remove password and refresh token field from the response
    const createdUser = await User.findById(newUser._id).select(
        "-password -refreshToken" // deselect them while forming final user object
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    // console.log(req.files)  // just for checking

    // return response
    return res.status(201).json(
        new ApiResponse(201,
            {
                createdUser
            },
            "User registered successfully")
    )
})


const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body

    // either email or username
    if (!(username || email) || !password) {
        throw new ApiError(400, "Email/Username and password are required");
    }

    // check user
    const exisitingUser = await User.findOne({
        $or: [{ email }, { username }]
    })
    if (!exisitingUser) {
        throw new ApiError(400, "User is not registered")
    }

    // validate from database
    const validatePassword = await exisitingUser.isPasswordCorrect(password)

    if (!validatePassword) {
        throw new ApiError(401, "User credential invalid")
    }


    // accessToken
    const accessToken = await exisitingUser.generateAccessToken()
    // refreshToken
    const refreshToken = await exisitingUser.generateRefreshToken()

    exisitingUser.refreshToken = refreshToken
    await exisitingUser.save({ validateBeforeSave: false })

    const loggedInUser = await User.findById(exisitingUser._id).select(
        "-password -refreshToken" // refreshtoken is stored in db
    )

    // send cookies
    const options = getAuthCookieOptions()

    return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(
            new ApiResponse(200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged in successfully"
            )
        )
})


const logoutUser = asyncHandler(async (req, res) => {
    const userId = req.user._id

    await User.findByIdAndUpdate(userId,
        {
            $set: { refreshToken: undefined }
        },
        {
            new: true
        }
    )

    const options = getAuthCookieOptions()

    return res
        .status(200)
        .clearCookie('accessToken', options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, 'User logged out successfully'))

})

// just hit a route and call this func when ever it is exhausted
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incommingRefreshToken =
        req.cookies?.refreshToken ||
        req.body?.refreshToken ||
        req.header("x-refresh-token")

    if (!incommingRefreshToken) {
        throw new ApiError(401, 'Unauthorized request')
    }

    try {
        const decodedToken = jwt.verify(incommingRefreshToken, env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken._id) // beacuse in creating refresh token we give payload as _id
        if (!user) {
            throw new ApiError(401, 'Invalid refresh token')
        }

        if (incommingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is expired ")
        }

        const options = getAuthCookieOptions()

        // accessToken
        const accessToken = await user.generateAccessToken()
        // refreshToken
        const newRefreshToken = await user.generateRefreshToken()

        // rotate refresh token
        user.refreshToken = newRefreshToken
        await user.save({ validateBeforeSave: false })


        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { 'accessToken': accessToken, 'refreshToken': newRefreshToken },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token")
    }
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            req.user,
            "Current user fetched successfully"
        ))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, username, email } = req.body;

    if (!fullName && !username && !email && !req.file) {
        throw new ApiError(400, "Update at least one field");
    }

    const updatePayload = {};

    if (fullName) updatePayload.fullName = fullName;
    if (username) updatePayload.username = username;
    if (email) updatePayload.email = email;

    // avatar is OPTIONAL
    if (req.file?.path) {
        const avatarUpload = await uploadOnCloudinary(req.file.path);

        if (!avatarUpload?.secure_url) {
            throw new ApiError(500, "Avatar upload failed");
        }

        updatePayload.avatar = avatarUpload.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updatePayload },
        { new: true, runValidators: true }
    ).select("-password -refreshToken");

    if (!updatedUser) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedUser,
            "Account details updated successfully"
        )
    );
});


const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    if (!oldPassword && !newPassword) {
        throw new ApiError(400, 'Both fields required')
    }

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old Password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            "Password changed successfully"
        ))
})

const deleteUserAccount = asyncHandler(async (req, res) => {

    const { password } = req.body

    if (!password) {
        throw new ApiError(400, "Password is required")
    }

    const user = await User.findById(req.user._id)

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    // verifyPass
    const isPasswordCorrect = await user.isPasswordCorrect(password)
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid password")
    }

    // soft delete
    user.isActive = false
    user.refreshToken = undefined

    await user.save({ validateBeforeSave: false })

    const cookieOptions = {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
    }

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(
            new ApiResponse(
                200,
                {},
                "Account deleted successfully"
            )
        )
})



const getUserOrders = asyncHandler(async (req, res) => {
    // Safety: block deactivated users
    if (!req.user?.isActive) {
        throw new ApiError(403, "Account is deactivated")
    }

    const orders = await Order.find({
        user: req.user?._id,
        paymentStatus: 'paid'
    })
        .populate("items.product", "title images price isDigital")
        .sort({ createdAt: -1 })

    return res.status(200).json(
        new ApiResponse(
            200,
            orders,
            "User orders fetched successfully"
        )
    )
})


const getUserDownloads = asyncHandler(async (req, res) => {
    if (!req.user?.isActive) {
        throw new ApiError(403, "Account is deactivated")
    }

    const orders = await Order.find({
        user: req.user._id,
        paymentStatus: "paid",
        orderStatus: "completed",
    }).populate("items.product")

    const downloadsMap = new Map()

    orders.forEach(order => {
        order.items.forEach(item => {
            const product = item.product

            if (
                product &&
                product.isDigital &&
                product.isActive &&
                product.downloadUrl // cloudinary public_id
            ) {
                downloadsMap.set(product._id.toString(), {
                    _id: product._id,
                    title: product.title,
                    description: product.description,
                    images: product.images,
                    purchasedAt: order.createdAt,
                    // Return a clean, app-owned download URL.
                    // The backend will verify purchase + redirect to a short-lived Cloudinary signed URL.
                    downloadUrl: `/api/v1/users/downloads/${product._id}`,
                })
            }
        })
    })

    const downloads = Array.from(downloadsMap.values())

    return res.status(200).json(
        new ApiResponse(
            200,
            downloads,
            "User downloads fetched successfully"
        )
    )
})


// Download a purchased digital asset.
// Returns a redirect to a short-lived Cloudinary authenticated download URL.
const downloadPurchasedAsset = asyncHandler(async (req, res) => {
    if (!req.user?.isActive) {
        throw new ApiError(403, "Account is deactivated")
    }

    const { productId } = req.params
    if (!productId) {
        throw new ApiError(400, "Missing product id")
    }

    const product = await Product.findById(productId)
    if (!product || !product.isActive) {
        throw new ApiError(404, "Product not found")
    }

    if (!product.isDigital || !product.downloadUrl) {
        throw new ApiError(400, "No downloadable asset for this product")
    }

    const hasPurchase = await Order.exists({
        user: req.user._id,
        paymentStatus: "paid",
        orderStatus: "completed",
        "items.product": product._id,
    })

    if (!hasPurchase) {
        throw new ApiError(403, "You have not purchased this item")
    }

    // Backward compatible:
    // - Old format: "folder/public_id" (assume raw)
    // - New format: "resourceType:folder/public_id" (e.g. "video:..." for mp4)
    const rawValue = String(product.downloadUrl)
    const hasPrefix = rawValue.includes(":")
    const resourceType = hasPrefix ? rawValue.split(":", 1)[0] : "raw"
    const publicId = hasPrefix ? rawValue.slice(resourceType.length + 1) : rawValue

    const expiresAt = Math.floor(Date.now() / 1000) + 60 * 5 // 5 minutes
    const signedUrl = cloudinary.utils.private_download_url(publicId, "", {
        resource_type: resourceType,
        type: "authenticated",
        expires_at: expiresAt,
        attachment: true,
    })

    return res.redirect(signedUrl)
})


// todos
// adminGetAllUsers	Admin panel and other admin controllers

const adminGetAllUsers = asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10

    const options = {
        page,
        limit,
        sort: { createdAt: -1 },
        select: "-password -refreshToken",
        lean: true,
    }

    const result = await User.paginate({}, options)

    const onlineUserIds = getOnlineUserIds();
    const usersWithOnlineStatus = result.docs.map(user => ({
        ...user,
        isOnline: onlineUserIds.has(user._id.toString())
    }));

    const uniqueVisitors = await Visitor.countDocuments();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    uniqueVisitors,
                    users: usersWithOnlineStatus,
                    pagination: {
                        totalUsers: result.totalDocs,
                        totalPages: result.totalPages,
                        currentPage: result.page,
                        limit: result.limit,
                        hasNextPage: result.hasNextPage,
                        hasPrevPage: result.hasPrevPage,
                    },
                },
                "All users fetched successfully"
            )
        )
})


const adminGetALlOrders = asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10

    const options = {
        page,
        limit,
        sort: { createdAt: -1 },
        populate: [
            { path: "user", select: "username email" },
            { path: "items.product", select: "title price isDigital" },
        ],
    }
    const result = await Order.paginate({}, options)

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                orders: result.docs,
                pagination: {
                    totalOrders: result.totalDocs,
                    totalPages: result.totalPages,
                    currentPage: result.page,
                    limit: result.limit,
                    hasNextPage: result.hasNextPage,
                    hasPrevPage: result.hasPrevPage,
                },
            },
            "All orders fetched successfully"
        )
    )
})


const adminGetStats = asyncHandler(async (req, res) => {
    const [paidAgg] = await Order.aggregate([
        { $match: { paymentStatus: "paid" } },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: "$totalAmount" },
                totalPaidOrders: { $sum: 1 },
            },
        },
    ])

    const totalOrders = await Order.countDocuments({})

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalRevenue: paidAgg?.totalRevenue ?? 0,
                totalPaidOrders: paidAgg?.totalPaidOrders ?? 0,
                totalOrders,
            },
            "Admin stats fetched successfully"
        )
    )
})


const adminGetAllPayments = asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10

    const options = {
        page,
        limit,
        sort: { createdAt: -1 },
        populate: [
            { path: "user", select: "username email" },
            { path: "order", select: "totalAmount paymentStatus orderStatus" },
        ],
    }
    const result = await Payment.paginate({}, options)

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                payments: result.docs,
                pagination: {
                    totalPayments: result.totalDocs,
                    totalPages: result.totalPages,
                    currentPage: result.page,
                    limit: result.limit,
                    hasNextPage: result.hasNextPage,
                    hasPrevPage: result.hasPrevPage,
                },
            },
            "All payments fetched successfully"
        )
    )
})

const promoteUserToAdmin = asyncHandler(async (req, res) => {
    const { userId } = req.params

    const user = await User.findById(userId)

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    if (user.role === 'admin') {
        throw new ApiError(400, "User is already an admin")
    }

    // else change roles
    user.role = 'admin'
    await user.save({ validateBeforeSave: false })

    const promotedUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    return res.status(200).json(
        new ApiResponse(
            200,
            promotedUser,
            "User promoted to admin successfully"
        )
    )
})


const demoteAdminToUser = asyncHandler(async (req, res) => {
    const { userId } = req.params

    // prevent self-demotion
    if (req.user._id.equals(userId)) {
        throw new ApiError(400, "You cannot demote yourself")
    }

    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    if (user.role !== "admin") {
        throw new ApiError(400, "User is not an admin")
    }

    // prevent removing last admin
    const adminCount = await User.countDocuments({ role: "admin" })
    if (adminCount <= 1) {
        throw new ApiError(400, "At least one admin must exist")
    }

    user.role = "user"
    await user.save({ validateBeforeSave: false })

    const demotedUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    return res.status(200).json(
        new ApiResponse(
            200,
            demotedUser,
            "Admin demoted to user"
        )
    )
})




// PASSWORD RESET FLOW


const requestPasswordReset = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({ email });
    if (!user) {
        // Return 200 anyway to prevent email enumeration attacks
        return res.status(200).json(new ApiResponse(200, null, "If an account exists with that email, a reset link has been sent. Please check your spam folder as well."));
    }

    // Generate a random token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash it to save in the DB (security best practice)
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save({ validateBeforeSave: false });

    // Send the email with the unhashed token
    const resetUrl = `${env.APP_URL || "http://localhost:3000"}/reset-password/${resetToken}`;
    const { subject, text, html } = emailTemplates.passwordReset({ resetUrl, user });

    try {
        await sendEmail({ to: user.email, subject, text, html });
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save({ validateBeforeSave: false });
        throw new ApiError(500, "Failed to send reset email. Please try again later.");
    }

    return res.status(200).json(new ApiResponse(200, null, "If an account exists with that email, a reset link has been sent. Please check your spam folder as well."));
});

const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
        throw new ApiError(400, "New password is required");
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
        throw new ApiError(400, "Token is invalid or has expired");
    }

    // user.pre('save') handles the hashing
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return res.status(200).json(new ApiResponse(200, null, "Password reset successfully. You can now log in."));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    updateAccountDetails,
    changePassword,
    requestPasswordReset,
    resetPassword,
    deleteUserAccount,
    getUserOrders,
    getUserDownloads,
    downloadPurchasedAsset,

    // admin roles
    adminGetAllUsers,
    adminGetAllPayments,
    adminGetALlOrders,
    adminGetStats,
    promoteUserToAdmin,
    demoteAdminToUser

}