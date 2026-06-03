import { prisma } from "../../lib/prisma.js";

// ─── Destinations ────────────────────────────────────────────────

export async function getAllDestinations({
  search,
  country,
  tags,
  cursor,
  limit,
}) {
  const where = {
    // only show non-deleted destinations
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(country && { country: { equals: country, mode: "insensitive" } }),
    ...(tags && {
      tags: { hasSome: tags.split(",").map((t) => t.trim()) },
    }),
  };

  const destinations = await prisma.destination.findMany({
    where,
    take: limit + 1, // fetch one extra to know if there's a next page
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1, // skip the cursor itself
    }),
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { hotels: true, reviews: true, packages: true },
      },
    },
  });

  // determine if there's a next page
  const hasNextPage = destinations.length > limit;
  const data = hasNextPage ? destinations.slice(0, -1) : destinations;
  const nextCursor = hasNextPage ? data[data.length - 1].id : null;

  return { data, nextCursor, hasNextPage };
}

export async function getDestinationById(id) {
  const destination = await prisma.destination.findUnique({
    where: { id },
    include: {
      hotels: {
        include: {
          rooms: true,
          _count: { select: { reviews: true } },
        },
      },
      reviews: {
        where: { targetType: "DESTINATION" },
        include: {
          user: { select: { id: true, fullName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      packages: {
        include: { items: true },
      },
      transports: {
        orderBy: { schedule: "asc" },
      },
      _count: {
        select: { hotels: true, reviews: true, packages: true },
      },
    },
  });

  if (!destination) throw { status: 404, message: "Destination not found" };

  // compute average rating from reviews
  const avgRating = destination.reviews.length
    ? destination.reviews.reduce((sum, r) => sum + r.rating, 0) /
      destination.reviews.length
    : null;

  return { ...destination, avgRating };
}

export async function createDestination(data) {
  return prisma.destination.create({ data });
}

export async function updateDestination(id, data) {
  await assertDestinationExists(id);
  return prisma.destination.update({ where: { id }, data });
}

export async function deleteDestination(id) {
  await assertDestinationExists(id);
  // hard delete is fine for destinations (not financial data)
  return prisma.destination.delete({ where: { id } });
}

// ─── Reviews ─────────────────────────────────────────────────────

export async function getDestinationReviews(destinationId) {
  await assertDestinationExists(destinationId);

  return prisma.review.findMany({
    where: { destinationId, targetType: "DESTINATION" },
    include: {
      user: { select: { id: true, fullName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createReview(destinationId, userId, data) {
  await assertDestinationExists(destinationId);

  // prevent duplicate reviews
  const existing = await prisma.review.findFirst({
    where: { destinationId, userId, targetType: "DESTINATION" },
  });
  if (existing)
    throw {
      status: 409,
      message: "You have already reviewed this destination",
    };

  return prisma.review.create({
    data: {
      ...data,
      targetType: "DESTINATION",
      userId,
      destinationId,
    },
  });
}

export async function deleteReview(reviewId, userId, userRole) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });

  if (!review) throw { status: 404, message: "Review not found" };

  // only the author or an admin can delete
  if (review.userId !== userId && userRole !== "ADMIN") {
    throw {
      status: 403,
      message: "You do not have permission to delete this review",
    };
  }

  return prisma.review.delete({ where: { id: reviewId } });
}

// ─── Helpers ─────────────────────────────────────────────────────

async function assertDestinationExists(id) {
  const destination = await prisma.destination.findUnique({ where: { id } });
  if (!destination) throw { status: 404, message: "Destination not found" };
}
