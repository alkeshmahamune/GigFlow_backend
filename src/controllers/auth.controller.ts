import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User, { UserRole } from "../models/user.model";
import { AppError } from "../utils/appError";

const JWT_SECRET = process.env.JWT_SECRET ?? "default_secret";
const JWT_EXPIRES_IN = "7d";

function signToken(userId: string): string {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export async function registerHandler(req: Request, res: Response): Promise<void> {
  const { name, email, password, role } = req.body as {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  };

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("Email already exists", 400);
  }

  const user = await User.create({ name, email, password, role });
  const token = signToken(user._id.toString());

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    },
  });
}

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email: string; password: string };

  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = signToken(user._id.toString());

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    },
  });
}
