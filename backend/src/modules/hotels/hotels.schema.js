import { z } from "zod";

export const createHotelSchema = z.object({
  destinationId: z.uuid("Invalid destination ID"),
  name: z.string().min(2, "Hotel name is required"),
  rating: z.number().min(1).max(5).optional(),
  amenities: z.array(z.string()).default([]),
});

export const updateHotelSchema = createHotelSchema
  .omit({ destinationId: true })
  .partial();

export const hotelQuerySchema = z.object({
  destinationId: z.uuid().optional(),
  search: z.string().optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  amenities: z.string().optional(), // comma-separated: "wifi,pool"
  minPrice: z.coerce.number().optional(), // filters by cheapest room
  maxPrice: z.coerce.number().optional(),
  cursor: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export const createRoomSchema = z.object({
  type: z.string().min(2, "Room type is required"), // e.g. "Deluxe", "Suite"
  capacity: z.number().int().min(1, "Capacity must be at least 1"),
  pricePerNight: z.number().positive("Price must be a positive number"),
  totalRooms: z.number().int().min(1).default(1),
});

export const updateRoomSchema = createRoomSchema.partial();

export const availabilityQuerySchema = z
  .object({
    checkIn: z.coerce.date(),
    checkOut: z.coerce.date(),
  })
  .refine((data) => data.checkOut > data.checkIn, {
    message: "Check-out must be after check-in",
    path: ["checkOut"],
  });

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().min(10, "Review must be at least 10 characters").optional(),
});
