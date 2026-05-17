import { Request, Response } from "express";
import { Types } from "mongoose";
import Lead, { LeadSource, LeadStatus } from "../models/lead.model";
import { AppError } from "../utils/appError";
import { createCsvContent } from "../utils/csv";

function buildLeadFilter(req: Request) {
  const filter: Record<string, unknown> = {};
  const { status, source, search } = req.query;

  if (status && typeof status === "string") {
    filter.status = status;
  }

  if (source && typeof source === "string") {
    filter.source = source;
  }

  if (search && typeof search === "string") {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  return filter;
}

type OwnerReference = Types.ObjectId | { _id: Types.ObjectId };

function requireOwnership(req: Request, leadOwnerId: OwnerReference): void {
  const user = req.user;
  if (!user) {
    throw new AppError("Unauthorized access", 401);
  }

  if (user.role === "admin") {
    return;
  }

  const ownerId = "_id" in leadOwnerId ? leadOwnerId._id : leadOwnerId;
  if (!ownerId.equals(user._id)) {
    throw new AppError("Forbidden: not allowed to access this lead", 403);
  }
}

export async function createLeadHandler(req: Request, res: Response): Promise<void> {
  const payload = req.body as {
    name: string;
    email: string;
    status: LeadStatus;
    source: LeadSource;
  };

  if (!req.user) {
    throw new AppError("Unauthorized access", 401);
  }

  const lead = await Lead.create({
    ...payload,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: { lead } });
}

export async function getLeadsHandler(req: Request, res: Response): Promise<void> {
  const page = Number(req.query.page ?? 1);
  const limit = 10;
  const skip = (page - 1) * limit;

  const baseFilter = buildLeadFilter(req);

  if (req.user && req.user.role === "sales") {
    baseFilter.createdBy = req.user._id;
  }

  const sortOrder = req.query.sort === "oldest" ? { createdAt: 1 as const } : { createdAt: -1 as const };

  const total = await Lead.countDocuments(baseFilter);
  const leads = await Lead.find(baseFilter)
    .sort(sortOrder)
    .skip(skip)
    .limit(limit)
    .populate("createdBy", "name email role");

  res.status(200).json({
    success: true,
    data: {
      leads,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    },
  });
}

export async function getLeadHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const lead = await Lead.findById(id).populate("createdBy", "name email role");
  if (!lead) {
    throw new AppError("Lead not found", 404);
  }

  requireOwnership(req, lead.createdBy as Types.ObjectId);

  res.status(200).json({ success: true, data: { lead } });
}

export async function updateLeadHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const payload = req.body as Partial<{
    name: string;
    email: string;
    status: LeadStatus;
    source: LeadSource;
  }>;

  const lead = await Lead.findById(id);
  if (!lead) {
    throw new AppError("Lead not found", 404);
  }

  requireOwnership(req, lead.createdBy as Types.ObjectId);

  lead.name = payload.name ?? lead.name;
  lead.email = payload.email ?? lead.email;
  lead.status = payload.status ?? lead.status;
  lead.source = payload.source ?? lead.source;

  await lead.save();

  res.status(200).json({ success: true, data: { lead } });
}

export async function deleteLeadHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const lead = await Lead.findById(id);
  if (!lead) {
    throw new AppError("Lead not found", 404);
  }

  requireOwnership(req, lead.createdBy as Types.ObjectId);
  await lead.deleteOne();

  res.status(200).json({ success: true, data: { message: "Lead deleted successfully" } });
}

export async function exportLeadsHandler(req: Request, res: Response): Promise<void> {
  const baseFilter = buildLeadFilter(req);

  if (req.user && req.user.role === "sales") {
    baseFilter.createdBy = req.user._id;
  }

  const leads = await Lead.find(baseFilter).sort({ createdAt: -1 }).populate("createdBy", "name email role");

  const records = leads.map((lead) => {
    const createdByValue = lead.createdBy as unknown;
    const ownerName =
      typeof createdByValue === "object" && createdByValue !== null && "name" in createdByValue
        ? (createdByValue as { name: string }).name
        : "";

    return {
      name: lead.name,
      email: lead.email,
      status: lead.status,
      source: lead.source,
      createdAt: lead.createdAt.toISOString(),
      ownerName,
    };
  });

  const csvContent = createCsvContent(records, ["name", "email", "status", "source", "createdAt", "ownerName"]);

  res.header("Content-Type", "text/csv");
  res.header("Content-Disposition", "attachment; filename=leads.csv");
  res.send(csvContent);
}
