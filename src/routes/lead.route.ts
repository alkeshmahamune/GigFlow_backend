import { Router } from "express";
import {
  createLeadHandler,
  deleteLeadHandler,
  exportLeadsHandler,
  getLeadHandler,
  getLeadsHandler,
  updateLeadHandler,
} from "../controllers/lead.controller";
import { protect, requireRole } from "../middleware/auth";
import { validateRequest } from "../middleware/validate";
import { leadCreateSchema, leadUpdateSchema } from "../validators/lead.validator";

const router = Router();

router.use(protect);
router.get("/export", requireRole("admin", "sales"), exportLeadsHandler);
router.get("/", requireRole("admin", "sales"), getLeadsHandler);
router.post("/", requireRole("admin", "sales"), validateRequest(leadCreateSchema), createLeadHandler);
router.get("/:id", requireRole("admin", "sales"), getLeadHandler);
router.put("/:id", requireRole("admin", "sales"), validateRequest(leadUpdateSchema), updateLeadHandler);
router.delete("/:id", requireRole("admin", "sales"), deleteLeadHandler);

export default router;
