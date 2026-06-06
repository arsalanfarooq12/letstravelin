import { prisma } from "../../lib/prisma.js";

// ─── Helpers ──────────────────────────────────────────────────────

async function assertTransportExists(id) {
  const transport = await prisma.transport.findUnique({ where: { id } });
  if (!transport) throw { status: 404, message: "Transport route not found" };
  return transport;
}

async function assertDestinationExists(id, label = "Destination") {
  const dest = await prisma.destination.findUnique({ where: { id } });
  if (!dest) throw { status: 404, message: `${label} not found` };
  return dest;
}

// compute real-time booked seat count for a transport
async function getBookedSeatCount(transportId) {
  return prisma.booking.count({
    where: {
      transportId,
      status: { notIn: ["CANCELLED"] },
    },
  });
}

// ─── Transport CRUD ───────────────────────────────────────────────

export async function getAllTransports({
  originId,
  destinationId,
  type,
  date,
  minPrice,
  maxPrice,
  minSeats,
  cursor,
  limit,
}) {
  // date filter — match schedules on the given calendar day
  let scheduleFilter = {};
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    scheduleFilter = { schedule: { gte: start, lte: end } };
  }

  const where = {
    // only show future or today's schedules by default
    schedule: { gte: new Date(), ...scheduleFilter.schedule },
    ...(originId && { originId }),
    ...(destinationId && { destinationId }),
    ...(type && { type }),
    ...((minPrice || maxPrice) && {
      price: {
        ...(minPrice && { gte: minPrice }),
        ...(maxPrice && { lte: maxPrice }),
      },
    }),
  };

  const transports = await prisma.transport.findMany({
    where,
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    orderBy: { schedule: "asc" },
    include: {
      origin: { select: { id: true, name: true, country: true } },
      destination: { select: { id: true, name: true, country: true } },
      _count: { select: { bookings: true } },
    },
  });

  const hasNextPage = transports.length > limit;
  const data = hasNextPage ? transports.slice(0, -1) : transports;
  const nextCursor = hasNextPage ? data[data.length - 1].id : null;

  // attach real-time available seats to each result
  const dataWithSeats = await Promise.all(
    data.map(async (t) => {
      const bookedCount = t._count.bookings;
      const availableSeats = t.totalSeats - bookedCount;
      return {
        ...t,
        bookedCount,
        availableSeats,
        isSoldOut: availableSeats <= 0,
      };
    })
  );

  // apply minSeats filter after computing availability
  const filtered = minSeats
    ? dataWithSeats.filter((t) => t.availableSeats >= minSeats)
    : dataWithSeats;

  return { data: filtered, nextCursor, hasNextPage };
}

export async function getTransportById(id) {
  const transport = await prisma.transport.findUnique({
    where: { id },
    include: {
      origin: { select: { id: true, name: true, country: true } },
      destination: { select: { id: true, name: true, country: true } },
      _count: { select: { bookings: true } },
    },
  });

  if (!transport) throw { status: 404, message: "Transport route not found" };

  const bookedCount = transport._count.bookings;
  const availableSeats = transport.totalSeats - bookedCount;

  return {
    ...transport,
    bookedCount,
    availableSeats,
    isSoldOut: availableSeats <= 0,
  };
}

export async function createTransport(data) {
  await assertDestinationExists(data.originId, "Origin");
  await assertDestinationExists(data.destinationId, "Destination");

  // prevent duplicate route on same schedule
  const duplicate = await prisma.transport.findFirst({
    where: {
      originId: data.originId,
      destinationId: data.destinationId,
      type: data.type,
      schedule: data.schedule,
    },
  });
  if (duplicate) {
    throw {
      status: 409,
      message:
        "A transport route with this origin, destination, type and schedule already exists",
    };
  }

  return prisma.transport.create({ data });
}

export async function updateTransport(id, data) {
  const transport = await assertTransportExists(id);

  // if reducing totalSeats, make sure it's not below already booked count
  if (data.totalSeats !== undefined) {
    const bookedCount = await getBookedSeatCount(id);
    if (data.totalSeats < bookedCount) {
      throw {
        status: 400,
        message: `Cannot reduce seats below current bookings (${bookedCount} booked)`,
      };
    }
  }

  // prevent rescheduling a transport that already has bookings
  if (data.schedule && transport.schedule !== data.schedule) {
    const bookedCount = await getBookedSeatCount(id);
    if (bookedCount > 0) {
      throw {
        status: 400,
        message:
          "Cannot reschedule a transport that has existing bookings. Cancel all bookings first.",
      };
    }
  }

  return prisma.transport.update({ where: { id }, data });
}

export async function deleteTransport(id) {
  const bookedCount = await getBookedSeatCount(id);
  if (bookedCount > 0) {
    throw {
      status: 400,
      message: `Cannot delete a transport route with ${bookedCount} active booking(s). Cancel all bookings first.`,
    };
  }

  return prisma.transport.delete({ where: { id } });
}

// ─── Seat Availability ────────────────────────────────────────────

export async function getSeatAvailability(id) {
  const transport = await assertTransportExists(id);
  const bookedCount = await getBookedSeatCount(id);
  const availableSeats = transport.totalSeats - bookedCount;

  // breakdown of bookings by status
  const statusBreakdown = await prisma.booking.groupBy({
    by: ["status"],
    where: { transportId: id },
    _count: { status: true },
  });

  return {
    transportId: id,
    type: transport.type,
    schedule: transport.schedule,
    totalSeats: transport.totalSeats,
    bookedCount,
    availableSeats,
    isSoldOut: availableSeats <= 0,
    occupancyRate: Math.round((bookedCount / transport.totalSeats) * 100),
    statusBreakdown: statusBreakdown.map((s) => ({
      status: s.status,
      count: s._count.status,
    })),
  };
}

// ─── Booking Validation ───────────────────────────────────────────

export async function validateBooking(userId, { transportId, seats }) {
  const transport = await assertTransportExists(transportId);

  // 1. check the schedule hasn't passed
  if (new Date(transport.schedule) <= new Date()) {
    throw {
      status: 400,
      message: "Cannot book a transport that has already departed",
    };
  }

  // 2. check enough seats are available
  const bookedCount = await getBookedSeatCount(transportId);
  const availableSeats = transport.totalSeats - bookedCount;

  if (availableSeats < seats) {
    throw {
      status: 409,
      message: `Not enough seats available. Requested: ${seats}, Available: ${availableSeats}`,
    };
  }

  // 3. check user hasn't already booked this transport
  const existingBooking = await prisma.booking.findFirst({
    where: {
      userId,
      transportId,
      status: { notIn: ["CANCELLED"] },
    },
  });
  if (existingBooking) {
    throw {
      status: 409,
      message: "You already have an active booking for this transport",
    };
  }

  // all checks passed — return booking summary for the client
  return {
    valid: true,
    transportId,
    type: transport.type,
    origin: transport.originId,
    destination: transport.destinationId,
    schedule: transport.schedule,
    seatsRequested: seats,
    availableSeats,
    pricePerSeat: transport.price,
    totalPrice: Number(transport.price) * seats,
    currency: "USD",
  };
}
