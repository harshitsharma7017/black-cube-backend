import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/signup", AuthController.signUp);
router.post("/login", AuthController.signIn);
router.post("/logout", AuthController.logout);
router.get("/me", requireAuth, AuthController.getMe);

export default router;
