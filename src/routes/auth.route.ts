import { Router } from "express";
import { loginHandler, registerHandler } from "../controllers/auth.controller";
import { validateRequest } from "../middleware/validate";
import { loginSchema, registerSchema } from "../validators/auth.validator";

const router = Router();

router.post("/register", validateRequest(registerSchema), registerHandler);
router.post("/login", validateRequest(loginSchema), loginHandler);

export default router;
