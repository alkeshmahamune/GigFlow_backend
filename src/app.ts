import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import "express-async-errors";
import authRouter from "./routes/auth.route";
import leadRouter from "./routes/lead.route";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));

app.use("/api/auth", authRouter);
app.use("/api/leads", leadRouter);

app.use(notFoundHandler);
app.use(errorHandler);
