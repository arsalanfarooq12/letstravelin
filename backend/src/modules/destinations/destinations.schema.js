import { z } from "zod";

export const createDestinationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  country: z.string().min(2, "Country is required"),
  description: z.string().optional(),
  images: z.array(z.url("Each image must be a valid URL")).default([]),
  tags: z.array(z.string()).default([]),
});

export const updateDestinationSchema = createDestinationSchema.partial();

export const destinationQuerySchema = z.object({
  search: z.string().optional(),
  country: z.string().optional(),
  tags: z.string().optional(), // comma-separated: "beach,adventure"
  cursor: z.uuid().optional(), // for pagination
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().min(10, "Review must be at least 10 characters").optional(),
});
