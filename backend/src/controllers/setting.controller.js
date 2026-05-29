import { Setting } from "../models/setting.model.js";
import { Visitor } from "../models/visitor.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

let clients = [];

export const getOnlineUserIds = () => {
  const userIds = new Set();
  clients.forEach(c => {
    if (c.userId) userIds.add(c.userId.toString());
  });
  return userIds;
};

// @desc    Track unique visitors
// @route   POST /api/v1/settings/track-visit
// @access  Public
export const trackVisit = asyncHandler(async (req, res) => {
  const { visitorId } = req.body;
  
  if (!visitorId) {
    throw new ApiError(400, "visitorId is required");
  }

  // Get optional userId if they are logged in
  let userId = null;
  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
  if (token) {
    try {
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      if (decodedToken?._id) {
        userId = decodedToken._id;
      }
    } catch (err) {
      // ignore
    }
  }

  await Visitor.findOneAndUpdate(
    { visitorId },
    { 
      visitorId,
      $set: { lastActiveAt: Date.now() },
      ...(userId ? { userId } : {})
    },
    { new: true, upsert: true }
  );

  // Broadcast realtime update to any connected admin dashboards
  const totalVisitors = await Visitor.countDocuments();
  const visitorMsg = `data: ${JSON.stringify({ type: "visitor_count", count: totalVisitors })}\n\n`;
  clients.forEach(c => c.res.write(visitorMsg));

  return res.status(200).json(new ApiResponse(200, {}, "Visit tracked successfully"));
});

// @desc    SSE Stream for settings updates
// @route   GET /api/v1/settings/stream
// @access  Public
export const streamSettings = (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  let userId = null;
  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
  if (token) {
    try {
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      if (decodedToken?._id) {
        userId = decodedToken._id.toString();
      }
    } catch (err) {
      // invalid token, ignore
    }
  }

  // Send an initial heartbeat/ping
  res.write("data: connected\n\n");

  const clientObj = { res, userId };
  clients.push(clientObj);

  // Broadcast online status if this is their first active connection
  if (userId) {
    const activeCount = clients.filter(c => c.userId?.toString() === userId.toString()).length;
    if (activeCount === 1) {
      const presenceMsg = `data: ${JSON.stringify({ type: "presence", userId: userId.toString(), status: "online" })}\n\n`;
      clients.forEach(c => {
        if (c !== clientObj) c.res.write(presenceMsg);
      });
    }
  }

  req.on("close", () => {
    clients = clients.filter((client) => client !== clientObj);
    
    // Broadcast offline status if this was their last active connection
    if (userId) {
      const activeCount = clients.filter(c => c.userId?.toString() === userId.toString()).length;
      if (activeCount === 0) {
        const presenceMsg = `data: ${JSON.stringify({ type: "presence", userId: userId.toString(), status: "offline" })}\n\n`;
        clients.forEach(c => c.res.write(presenceMsg));
      }
    }
  });
};

// @desc    Get a setting by key
// @route   GET /api/v1/settings/:key
// @access  Public
export const getSetting = asyncHandler(async (req, res) => {
  const { key } = req.params;

  if (!key) {
    throw new ApiError(400, "Setting key is required");
  }

  const setting = await Setting.findOne({ key });

  return res.status(200).json(
    new ApiResponse(
      200, 
      setting ? { value: setting.value, updatedAt: setting.updatedAt } : null, 
      "Setting fetched successfully"
    )
  );
});

// @desc    Update or create a setting
// @route   PUT /api/v1/settings/:key
// @access  Private/Admin
export const updateSetting = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;

  if (!key) {
    throw new ApiError(400, "Setting key is required");
  }

  if (value === undefined) {
    throw new ApiError(400, "Setting value is required");
  }

  const setting = await Setting.findOneAndUpdate(
    { key },
    { value },
    { new: true, upsert: true } // Create if doesn't exist
  );

  // Broadcast the update to all connected SSE clients
  clients.forEach((client) => {
    client.res.write(`data: ${JSON.stringify({ value: setting.value, updatedAt: setting.updatedAt })}\n\n`);
  });

  return res.status(200).json(
    new ApiResponse(200, setting, "Setting updated successfully")
  );
});
