import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/user.model";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: string;
      };
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret") as { id: string };
    const user = await UserModel.findById(decoded.id).select("name email role").lean();

    if (!user) {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "User not found" } });
      return;
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (error) {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Invalid or expired token" } });
  }
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  // Must be called after requireAuth
  if (!req.user || req.user.role !== "ADMIN") {
    res.status(403).json({ error: { code: "FORBIDDEN", message: "Admin privileges required" } });
    return;
  }
  next();
};
