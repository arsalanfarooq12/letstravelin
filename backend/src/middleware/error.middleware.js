import { ZodError } from "zod";

export function errorHandler(err, req, res, next) {
  console.error(err);
  // only log full stack in development
  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  } else {
    console.error({ message: err.message, code: err.code, status: err.status });

    // Zod validation error
    if (err instanceof ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        issues: err.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }
    // Generic error handler for production
    return res.status(err.status ?? 500).json({
      error:
        process.env.NODE_ENV === "production" && !err.status
          ? "Internal server error" // hide unhandled error details
          : err.message ?? "Internal server error",
    });
  }

  // Prisma known errors
  if (err.code === "P2002") {
    return res
      .status(409)
      .json({ error: "A record with this value already exists" });
  }

  if (err.code === "P2025") {
    return res.status(404).json({ error: "Record not found" });
  }

  // Generic fallback
  return res.status(err.status ?? 500).json({
    error: err.message ?? "Internal server error",
  });
}
