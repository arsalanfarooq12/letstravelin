import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRouter from "./modules/auth/auth.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import destinationsRouter from "./modules/destinations/destinations.routes.js";
import transportRouter from "./modules/transport/transport.routes.js";
import packagesRouter from "./modules/packages/packages.routes.js";
import hotelsRouter from "./modules/hotels/hotels.routes.js";
dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(morgan("dev"));
app.use(express.json());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/destinations", destinationsRouter);
app.use("/api/hotels", hotelsRouter);
app.use("/api/transport", transportRouter);
app.use("/api/packages", packagesRouter);

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Global error handler — must be last
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
