import express from "express";
import { getMDA, getAllMDAs } from "../controller/mda.controller.js";
import { authenticate, authorizeAdmin } from "../middleware/auth.js";
import { validateMDACreation } from "../middleware/validation.js";

const router = express.Router();

router.use(authenticate);
router.use(authorizeAdmin);

// @route   GET /api/mdas
// @desc    Get all MDAs
// @access  Private (Admin)
router.get("/", getAllMDAs);

// @route   GET /api/mdas/:id
// @desc    Get all MDAs
// @access  Private (Admin)
router.get("/:id", getMDA);

export { router as mdaRoutes };
