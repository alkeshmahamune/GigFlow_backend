import Joi from "joi";
import { LeadSource, LeadStatus } from "../models/lead.model";

export const leadCreateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().required(),
  status: Joi.string().valid(...Object.values(LeadStatus)).required(),
  source: Joi.string().valid(...Object.values(LeadSource)).required(),
});

export const leadUpdateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  email: Joi.string().email(),
  status: Joi.string().valid(...Object.values(LeadStatus)),
  source: Joi.string().valid(...Object.values(LeadSource)),
}).min(1);
