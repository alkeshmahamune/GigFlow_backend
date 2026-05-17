import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model";
import { AppError } from "../utils/appError";

const JWT_SECRET = process.env.JWT_SECRET ?? "default_secret";

export async function protect(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Authorization token missing", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload: any = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      throw new AppError("Invalid token: user not found", 401);
    }

    req.user = user;
    next();
  } catch (error) {
    throw new AppError("Invalid or expired token", 401);
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user: any = req.user;
    if (!user) {
      throw new AppError("Unauthorized access", 401);
    }

    if (!roles.includes(user.role)) {
      throw new AppError("Forbidden: insufficient permissions", 403);
    }

    next();
  };
}
