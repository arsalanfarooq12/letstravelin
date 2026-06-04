import { prisma } from "../../lib/prisma.js";

// ─── Hotels ───────────────────────────────────────────────────────

export async function getAllHotels({
  destinationId,
  search,
  minRating,
  amenities,
  minPrice,
  maxPrice,
  cursor,
  limit,
}) {
  const where = {
    ...(destinationId && { destinationId }),
    ...(search && {
      name: { contains: search, mode: "insensitive" },
    }),
    ...(minRating && { rating: { gte: minRating } }),
    ...(amenities && {
      amenities: { hasSome: amenities.split(",").map((a) => a.trim()) },
    }),
    // filter by price range through the cheapest room in the hotel
    ...((minPrice || maxPrice) && {
      rooms: {
        some: {
          pricePerNight: {
            ...(minPrice && { gte: minPrice }),
            ...(maxPrice && { lte: maxPrice }),
          },
        },
      },
    }),
  };

  const hotels = await prisma.hotel.findMany({
    where,
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    orderBy: { createdAt: "desc" },
    include: {
      destination: { select: { id: true, name: true, country: true } },
      rooms: {
        select: {
          id: true,
          type: true,
          pricePerNight: true,
          capacity: true,
          totalRooms: true,
        },
      },
      _count: { select: { reviews: true } },
    },
  });

  const hasNextPage = hotels.length > limit;
  const data = hasNextPage ? hotels.slice(0, -1) : hotels;
  const nextCursor = hasNextPage ? data[data.length - 1].id : null;

  // attach cheapest room price to each hotel for display
  const dataWithPrice = data.map((hotel) => ({
    ...hotel,
    startingFrom: hotel.rooms.length
      ? Math.min(...hotel.rooms.map((r) => Number(r.pricePerNight)))
      : null,
  }));

  return { data: dataWithPrice, nextCursor, hasNextPage };
}

export async function getHotelById(id) {
  const hotel = await prisma.hotel.findUnique({
    where: { id },
    include: {
      destination: { select: { id: true, name: true, country: true } },
      rooms: true,
      reviews: {
        include: {
          user: { select: { id: true, fullName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: { select: { reviews: true } },
    },
  });

  if (!hotel) throw { status: 404, message: "Hotel not found" };

  const avgRating = hotel.reviews.length
    ? hotel.reviews.reduce((sum, r) => sum + r.rating, 0) / hotel.reviews.length
    : null;

  return { ...hotel, avgRating };
}

export async function createHotel(data) {
  // verify destination exists before creating
  const destination = await prisma.destination.findUnique({
    where: { id: data.destinationId },
  });
  if (!destination) throw { status: 404, message: "Destination not found" };

  return prisma.hotel.create({ data });
}

export async function updateHotel(id, data) {
  await assertHotelExists(id);
  return prisma.hotel.update({ where: { id }, data });
}

export async function deleteHotel(id) {
  await assertHotelExists(id);
  return prisma.hotel.delete({ where: { id } });
}

// ─── Rooms ────────────────────────────────────────────────────────

export async function getRoomsByHotel(hotelId) {
  await assertHotelExists(hotelId);

  return prisma.room.findMany({
    where: { hotelId },
    orderBy: { pricePerNight: "asc" },
  });
}

export async function createRoom(hotelId, data) {
  await assertHotelExists(hotelId);

  return prisma.room.create({
    data: { ...data, hotelId },
  });
}

export async function updateRoom(hotelId, roomId, data) {
  await assertRoomBelongsToHotel(hotelId, roomId);
  return prisma.room.update({ where: { id: roomId }, data });
}

export async function deleteRoom(hotelId, roomId) {
  await assertRoomBelongsToHotel(hotelId, roomId);
  return prisma.room.delete({ where: { id: roomId } });
}

// ─── Availability ─────────────────────────────────────────────────

export async function checkHotelAvailability(hotelId, { checkIn, checkOut }) {
  await assertHotelExists(hotelId);

  const rooms = await prisma.room.findMany({
    where: { hotelId },
    include: {
      bookings: {
        where: {
          // find all room bookings that overlap with the requested dates
          booking: { status: { notIn: ["CANCELLED"] } },
          OR: [{ checkIn: { lt: checkOut }, checkOut: { gt: checkIn } }],
        },
      },
    },
  });

  // for each room type, available = totalRooms - currently booked count
  const availability = rooms.map((room) => {
    const bookedCount = room.bookings.length;
    const availableCount = room.totalRooms - bookedCount;

    return {
      roomId: room.id,
      type: room.type,
      capacity: room.capacity,
      pricePerNight: room.pricePerNight,
      totalRooms: room.totalRooms,
      bookedCount,
      availableCount,
      isAvailable: availableCount > 0,
    };
  });

  const nights = Math.ceil(
    (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
  );

  return {
    hotelId,
    checkIn,
    checkOut,
    nights,
    rooms: availability,
    hasAnyAvailability: availability.some((r) => r.isAvailable),
  };
}

export async function checkRoomAvailability(
  hotelId,
  roomId,
  { checkIn, checkOut }
) {
  await assertRoomBelongsToHotel(hotelId, roomId);

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      bookings: {
        where: {
          booking: { status: { notIn: ["CANCELLED"] } },
          OR: [{ checkIn: { lt: checkOut }, checkOut: { gt: checkIn } }],
        },
      },
    },
  });

  const bookedCount = room.bookings.length;
  const availableCount = room.totalRooms - bookedCount;

  return {
    roomId,
    type: room.type,
    pricePerNight: room.pricePerNight,
    availableCount,
    isAvailable: availableCount > 0,
  };
}

// ─── Reviews ──────────────────────────────────────────────────────

export async function getHotelReviews(hotelId) {
  await assertHotelExists(hotelId);

  return prisma.review.findMany({
    where: { hotelId, targetType: "HOTEL" },
    include: {
      user: { select: { id: true, fullName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createReview(hotelId, userId, data) {
  await assertHotelExists(hotelId);

  const existing = await prisma.review.findFirst({
    where: { hotelId, userId, targetType: "HOTEL" },
  });
  if (existing)
    throw { status: 409, message: "You have already reviewed this hotel" };

  return prisma.review.create({
    data: { ...data, targetType: "HOTEL", userId, hotelId },
  });
}

export async function deleteReview(reviewId, userId, userRole) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw { status: 404, message: "Review not found" };

  if (review.userId !== userId && userRole !== "ADMIN") {
    throw {
      status: 403,
      message: "You do not have permission to delete this review",
    };
  }

  return prisma.review.delete({ where: { id: reviewId } });
}

// ─── Helpers ──────────────────────────────────────────────────────

async function assertHotelExists(id) {
  const hotel = await prisma.hotel.findUnique({ where: { id } });
  if (!hotel) throw { status: 404, message: "Hotel not found" };
  return hotel;
}

async function assertRoomBelongsToHotel(hotelId, roomId) {
  const room = await prisma.room.findFirst({ where: { id: roomId, hotelId } });
  if (!room) throw { status: 404, message: "Room not found in this hotel" };
  return room;
}
