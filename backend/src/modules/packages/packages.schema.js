import { z } from "zod";

export const createPackageSchema = z.object({
  destinationId: z.string().uuid("Invalid destination ID"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  durationDays: z.number().int().min(1, "Duration must be at least 1 day"),
  price: z.number().positive("Price must be positive"),
});

export const updatePackageSchema = createPackageSchema
  .omit({ destinationId: true })
  .partial();

export const packageQuerySchema = z.object({
  destinationId: z.string().uuid().optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minDays: z.coerce.number().int().optional(),
  maxDays: z.coerce.number().int().optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

// adding an item to a package
export const addPackageItemSchema = z.discriminatedUnion("itemType", [
  z.object({
    itemType: z.literal("HOTEL"),
    hotelId: z.string().uuid("Invalid hotel ID"),
    transportId: z.undefined().optional(),
  }),
  z.object({
    itemType: z.literal("TRANSPORT"),
    transportId: z.string().uuid("Invalid transport ID"),
    hotelId: z.undefined().optional(),
  }),
]);

// validate availability for a package before booking
export const validatePackageSchema = z
  .object({
    packageId: z.string().uuid("Invalid package ID"),
    checkIn: z.coerce.date(),
    checkOut: z.coerce.date(),
    seats: z.number().int().min(1).max(10).default(1),
  })
  .refine((data) => data.checkOut > data.checkIn, {
    message: "Check-out must be after check-in",
    path: ["checkOut"],
  });
