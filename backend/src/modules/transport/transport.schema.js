import { z } from "zod";

export const createTransportSchema = z
  .object({
    originId: z.string().uuid("Invalid origin destination ID"),
    destinationId: z.string().uuid("Invalid destination ID"),
    type: z.enum(["FLIGHT", "BUS", "FERRY", "TRAIN"]),
    schedule: z.coerce.date(),
    price: z.number().positive("Price must be positive"),
    totalSeats: z.number().int().min(1, "Must have at least 1 seat"),
  })
  .refine((data) => data.originId !== data.destinationId, {
    message: "Origin and destination cannot be the same",
    path: ["destinationId"],
  });

export const updateTransportSchema = z.object({
  type: z.enum(["FLIGHT", "BUS", "FERRY", "TRAIN"]).optional(),
  schedule: z.coerce.date().optional(),
  price: z.number().positive().optional(),
  totalSeats: z.number().int().min(1).optional(),
});

export const transportQuerySchema = z.object({
  originId: z.string().uuid().optional(),
  destinationId: z.string().uuid().optional(),
  type: z.enum(["FLIGHT", "BUS", "FERRY", "TRAIN"]).optional(),
  date: z.coerce.date().optional(), // filters schedules on this date
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minSeats: z.coerce.number().int().optional(), // only show routes with >= N seats left
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

// used before creating a booking — validates the intent
export const validateBookingSchema = z.object({
  transportId: z.string().uuid("Invalid transport ID"),
  seats: z.number().int().min(1, "Must book at least 1 seat").max(10),
});
