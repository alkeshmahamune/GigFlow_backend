import { Request, Response } from "express";
import Lead, { LeadSource, LeadStatus } from "../models/lead.model";
import { AppError } from "../utils/appError";
import { createCsvContent } from "../utils/csv";

function buildLeadFilter(req: Request): any {
  const filter: any = {};
  const status = req.query.status;
  const source = req.query.source;
  const search = req.query.search;

  if (typeof status === "string" && status) {
    filter.status = status;
  }

  if (typeof source === "string" && source) {
    filter.source = source;
  }

  if (typeof search === "string" && search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  return filter;
}

function checkOwnership(req: Request, lead: any): void {
  if (!req.user) {
    throw new AppError("Unauthorized access", 401);
  }

  if (req.user.role === "admin") {
    return;
  }

  const ownerId = lead.createdBy && (lead.createdBy._id || lead.createdBy);
  if (!ownerId.equals(req.user._id)) {
    throw new AppError("Forbidden: not allowed to access this lead", 403);
  }
}

export async function createLeadHandler(req: Request, res: Response): Promise<void> {
  const { name, email, status, source } = req.body as {
    name: string;
    email: string;
    status: LeadStatus;
    source: LeadSource;
  };

  if (!req.user) {
    throw new AppError("Unauthorized access", 401);
  }

  const lead = await Lead.create({
    name,
    email,
    status,
    source,
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

  const sortOrder: any = { createdAt: req.query.sort === "oldest" ? 1 : -1 };

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

  checkOwnership(req, lead);

  res.status(200).json({ success: true, data: { lead } });
}

export async function updateLeadHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { name, email, status, source } = req.body as {
    name?: string;
    email?: string;
    status?: LeadStatus;
    source?: LeadSource;
  };

  const lead = await Lead.findById(id);
  if (!lead) {
    throw new AppError("Lead not found", 404);
  }

  checkOwnership(req, lead);

  if (name) lead.name = name;
  if (email) lead.email = email;
  if (status) lead.status = status;
  if (source) lead.source = source;

  await lead.save();

  res.status(200).json({ success: true, data: { lead } });
}

export async function deleteLeadHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const lead = await Lead.findById(id);
  if (!lead) {
    throw new AppError("Lead not found", 404);
  }

  checkOwnership(req, lead);
  await lead.deleteOne();

  res.status(200).json({ success: true, data: { message: "Lead deleted successfully" } });
}

export async function exportLeadsHandler(req: Request, res: Response): Promise<void> {
  const baseFilter = buildLeadFilter(req);

  if (req.user && req.user.role === "sales") {
    baseFilter.createdBy = req.user._id;
  }

  const sortOrder: any = { createdAt: req.query.sort === "oldest" ? 1 : -1 };
  const leads = await Lead.find(baseFilter).sort(sortOrder).populate("createdBy", "name email role");

  const records = leads.map((lead) => {
    const createdBy: any = lead.createdBy;
    const ownerName = createdBy && createdBy.name ? createdBy.name : "";

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
