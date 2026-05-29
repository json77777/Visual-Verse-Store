import { Router } from "express";
import { getSetting, updateSetting, streamSettings, trackVisit } from "../controllers/setting.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/admin.middleware.js";

const router = Router();

router.route("/track-visit").post(trackVisit);
router.route("/stream").get(streamSettings);
router.route("/:key").get(getSetting);
router.route("/:key").put(verifyJWT, isAdmin, updateSetting);

export default router;
