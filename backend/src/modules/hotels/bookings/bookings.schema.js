import { z } from "zod";

// ─── Hotel Booking ────────────────────────────────────────────────
const hotelBookingSchema = z.object({
  type: z.literal("HOTEL"),
  rooms: z
    .array(
      z.object({
        roomId: z.uuid("Invalid room ID"),
        checkIn: z.coerce.date(),
        checkOut: z.coerce.date(),
      })
    )
    .min(1, "At least one room is required")
    .refine((rooms) => rooms.every((r) => r.checkOut > r.checkIn), {
      message: "Check-out must be after check-in for all rooms",
    }),
  currency: z.string().default("USD"),
});

// ─── Transport Booking ────────────────────────────────────────────
const transportBookingSchema = z.object({
  type: z.literal("TRANSPORT"),
  transportId: z.uuid("Invalid transport ID"),
  seats: z.number().int().min(1).max(10),
  currency: z.string().default("USD"),
});

// ─── Package Booking ──────────────────────────────────────────────
const packageBookingSchema = z
  .object({
    type: z.literal("PACKAGE"),
    packageId: z.uuid("Invalid package ID"),
    checkIn: z.coerce.date(),
    checkOut: z.coerce.date(),
    seats: z.number().int().min(1).max(10).default(1),
    currency: z.string().default("USD"),
  })
  .refine((data) => data.checkOut > data.checkIn, {
    message: "Check-out must be after check-in",
    path: ["checkOut"],
  });

// discriminated union — Zod picks schema based on `type` field
export const createBookingSchema = z.discriminatedUnion("type", [
  hotelBookingSchema,
  transportBookingSchema,
  packageBookingSchema,
]);

export const bookingQuerySchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]).optional(),
  type: z.enum(["HOTEL", "TRANSPORT", "PACKAGE"]).optional(),
  cursor: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const assignAgentSchema = z.object({
  agentId: z.uuid("Invalid agent ID"),
});

export const markPaidSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  gateway: z.string().min(1, "Gateway is required"), // e.g. "CASH", "BANK_TRANSFER"
  transactionId: z.string().min(1, "Transaction ID is required"),
});
