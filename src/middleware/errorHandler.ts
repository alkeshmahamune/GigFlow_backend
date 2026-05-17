import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/appError";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
}

export function errorHandler(error: Error, req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  console.error(error);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}
