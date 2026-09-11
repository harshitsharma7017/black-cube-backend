import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/user.model";
import { signUpSchema, signInSchema } from "../validators/auth.validator";
import { AuditLogService } from "../services/audit-log.service";

export class AuthController {
  static async signUp(req: Request, res: Response, next: NextFunction) {
    console.log("[SignUp Controller] Received sign-up request for:", req.body?.email);
    try {
      const data = signUpSchema.parse(req.body);
      console.log("[SignUp Controller] Input validation passed for:", data.email);

      const existing = await UserModel.findOne({ email: data.email });
      if (existing) {
        console.warn("[SignUp Controller] Email already registered:", data.email);
        res.status(409).json({ error: { code: "CONFLICT", message: "Email already registered" } });
        return;
      }

      let role: "ADMIN" | "VIEWER" = "VIEWER";
      const bootstrapEmail = process.env.ADMIN_BOOTSTRAP_EMAIL;
      
      if (bootstrapEmail && data.email === bootstrapEmail) {
        role = "ADMIN";
      }
      console.log("[SignUp Controller] Assigned role:", role);

      const passwordHash = await bcrypt.hash(data.password, 10);
      console.log("[SignUp Controller] Hashed password and creating user in DB...");
      const user = await UserModel.create({
        name: data.name,
        email: data.email,
        passwordHash,
        role
      });
      console.log("[SignUp Controller] User created successfully with ID:", user._id.toString());

      console.log("[SignUp Controller] Creating audit log entry...");
      await AuditLogService.logAction({
        action: "SIGN_UP",
        entityId: user._id.toString(),
        entityType: "User",
        details: { role },
        actor: { id: user._id.toString(), name: user.name, email: user.email }
      });

      res.status(201).json({ data: { success: true }, error: null, meta: null });
    } catch (error: any) {
      if (error.name === "ZodError") {
        console.warn("[SignUp Controller] Validation error:", error.errors);
        res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid input", details: error.errors } });
        return;
      }
      console.error("[SignUp Controller] Internal error during sign-up:", error);
      next(error);
    }
  }

  static async signIn(req: Request, res: Response, next: NextFunction) {
    try {
      const data = signInSchema.parse(req.body);
      
      const user = await UserModel.findOne({ email: data.email });
      if (!user) {
        res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Invalid credentials" } });
        return;
      }

      const isMatch = await bcrypt.compare(data.password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Invalid credentials" } });
        return;
      }

      const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET || "fallback_secret", { expiresIn: "1d" });
      
      

      await AuditLogService.logAction({
        action: "SIGN_IN",
        entityId: user._id.toString(),
        entityType: "User",
        actor: { id: user._id.toString(), name: user.name, email: user.email }
      });

      res.json({ data: { success: true, token }, error: null, meta: null });
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid input", details: error.errors } });
        return;
      }
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user) {
        await AuditLogService.logAction({
          action: "SIGN_OUT",
          entityId: req.user.id,
          entityType: "User",
          actor: req.user
        });
      }
      
      res.json({ data: { success: true, token }, error: null, meta: null });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: Request, res: Response) {
    if (!req.user) {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
      return;
    }
    res.json({ data: req.user, error: null, meta: null });
  }
}
