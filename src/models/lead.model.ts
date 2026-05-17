import { Document, model, Model, Schema, Types } from "mongoose";

export enum LeadStatus {
  New = "New",
  Contacted = "Contacted",
  Qualified = "Qualified",
  Lost = "Lost",
}

export enum LeadSource {
  Website = "Website",
  Instagram = "Instagram",
  Referral = "Referral",
}

export interface ILead extends Document {
  name: string;
  email: string;
  status: LeadStatus;
  source: LeadSource;
  createdAt: Date;
  createdBy: Types.ObjectId;
}

const leadSchema = new Schema<ILead>({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true },
  status: { type: String, enum: Object.values(LeadStatus), default: LeadStatus.New },
  source: { type: String, enum: Object.values(LeadSource), default: LeadSource.Website },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

const Lead: Model<ILead> = model<ILead>("Lead", leadSchema);
export default Lead;
