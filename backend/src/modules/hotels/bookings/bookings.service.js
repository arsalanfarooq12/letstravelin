import { prisma } from "../../lib/prisma.js";

// ─── Helpers ──────────────────────────────────────────────────────

async function assertBookingExists(id) {
  const booking = await prisma.booking.findFirst({
    where: { id, deletedAt: null },
  });
  if (!booking) throw { status: 404, message: "Booking not found" };
  return booking;
}

const bookingInclude = {
  user: { select: { id: true, fullName: true, email: true } },
  assignedAgent: { select: { id: true, fullName: true } },
  transport: {
    include: {
      origin: { select: { id: true, name: true } },
      destination: { select: { id: true, name: true } },
    },
  },
  package: {
    include: {
      destination: { select: { id: true, name: true } },
      packageItems: {
        include: {
          hotel: { select: { id: true, name: true } },
          transport: { select: { id: true, type: true, schedule: true } },
        },
      },
    },
  },
  rooms: {
    include: {
      room: {
        include: {
          hotel: {
            include: {
              destination: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  },
  payments: true,
};

// ─── Create Booking ───────────────────────────────────────────────

export async function createBooking(userId, data) {
  switch (data.type) {
    case "HOTEL":
      return createHotelBooking(userId, data);
    case "TRANSPORT":
      return createTransportBooking(userId, data);
    case "PACKAGE":
      return createPackageBooking(userId, data);
  }
}

async function createHotelBooking(userId, { rooms, currency }) {
  let totalPrice = 0;
  const roomValidations = [];

  for (const { roomId, checkIn, checkOut } of rooms) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { hotel: true },
    });
    if (!room) throw { status: 404, message: `Room ${roomId} not found` };

    // check availability — no overlapping confirmed/pending bookings
    const bookedCount = await prisma.roomBooking.count({
      where: {
        roomId,
        booking: { status: { notIn: ["CANCELLED"] } },
        OR: [{ checkIn: { lt: checkOut }, checkOut: { gt: checkIn } }],
      },
    });

    if (bookedCount >= room.totalRooms) {
      throw {
        status: 409,
        message: `Room "${room.type}" at ${room.hotel.name} is not available for selected dates`,
      };
    }

    const nights = Math.ceil(
      (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
    );
    const roomTotal = Number(room.pricePerNight) * nights;
    totalPrice += roomTotal;

    roomValidations.push({
      room,
      checkIn,
      checkOut,
      nights,
      pricePerNight: room.pricePerNight,
    });
  }

  // create booking + all room bookings in a transaction
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.create({
      data: {
        userId,
        type: "HOTEL",
        totalPrice,
        currency,
        status: "PENDING",
        rooms: {
          create: roomValidations.map(
            ({ room, checkIn, checkOut, nights, pricePerNight }) => ({
              roomId: room.id,
              checkIn,
              checkOut,
              nights,
              pricePerNight,
            })
          ),
        },
      },
      include: bookingInclude,
    });
    return booking;
  });
}

async function createTransportBooking(
  userId,
  { transportId, seats, currency }
) {
  const transport = await prisma.transport.findUnique({
    where: { id: transportId },
  });
  if (!transport) throw { status: 404, message: "Transport route not found" };

  // check schedule hasn't passed
  if (new Date(transport.schedule) <= new Date()) {
    throw {
      status: 400,
      message: "Cannot book a transport that has already departed",
    };
  }

  // check seat availability
  const bookedSeats = await prisma.booking.count({
    where: { transportId, status: { notIn: ["CANCELLED"] } },
  });
  const availableSeats = transport.totalSeats - bookedSeats;
  if (availableSeats < seats) {
    throw {
      status: 409,
      message: `Not enough seats. Requested: ${seats}, Available: ${availableSeats}`,
    };
  }

  // prevent duplicate booking
  const duplicate = await prisma.booking.findFirst({
    where: { userId, transportId, status: { notIn: ["CANCELLED"] } },
  });
  if (duplicate) {
    throw {
      status: 409,
      message: "You already have an active booking for this transport",
    };
  }

  const totalPrice = Number(transport.price) * seats;

  return prisma.booking.create({
    data: {
      userId,
      type: "TRANSPORT",
      transportId,
      totalPrice,
      currency,
      status: "PENDING",
    },
    include: bookingInclude,
  });
}

async function createPackageBooking(
  userId,
  { packageId, checkIn, checkOut, seats, currency }
) {
  const pkg = await prisma.package.findUnique({
    where: { id: packageId },
    include: {
      packageItems: {
        include: { hotel: { include: { rooms: true } }, transport: true },
      },
    },
  });
  if (!pkg) throw { status: 404, message: "Package not found" };

  // check duration matches
  const nights = Math.ceil(
    (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
  );
  if (nights !== pkg.durationDays) {
    throw {
      status: 400,
      message: `Package is designed for ${pkg.durationDays} night(s), your dates span ${nights} night(s)`,
    };
  }

  // prevent duplicate package booking
  const duplicate = await prisma.booking.findFirst({
    where: { userId, packageId, status: { notIn: ["CANCELLED"] } },
  });
  if (duplicate) {
    throw {
      status: 409,
      message: "You already have an active booking for this package",
    };
  }

  // validate all items inside the package
  for (const item of pkg.packageItems) {
    if (item.itemType === "HOTEL" && item.hotel) {
      for (const room of item.hotel.rooms) {
        const bookedCount = await prisma.roomBooking.count({
          where: {
            roomId: room.id,
            booking: { status: { notIn: ["CANCELLED"] } },
            OR: [{ checkIn: { lt: checkOut }, checkOut: { gt: checkIn } }],
          },
        });
        if (bookedCount >= room.totalRooms) {
          throw {
            status: 409,
            message: `Hotel "${item.hotel.name}" has no available rooms for selected dates`,
          };
        }
      }
    }

    if (item.itemType === "TRANSPORT" && item.transport) {
      const bookedSeats = await prisma.booking.count({
        where: {
          transportId: item.transport.id,
          status: { notIn: ["CANCELLED"] },
        },
      });
      const availableSeats = item.transport.totalSeats - bookedSeats;
      if (availableSeats < seats) {
        throw {
          status: 409,
          message: `Transport ${item.transport.type} has insufficient seats. Available: ${availableSeats}`,
        };
      }
    }
  }

  const totalPrice = Number(pkg.price) * seats;

  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.create({
      data: {
        userId,
        type: "PACKAGE",
        packageId,
        totalPrice,
        currency,
        status: "PENDING",
        // create room bookings for hotel items in the package
        rooms: {
          create: pkg.packageItems
            .filter((i) => i.itemType === "HOTEL" && i.hotel?.rooms?.length)
            .flatMap((i) =>
              i.hotel.rooms.map((room) => ({
                roomId: room.id,
                checkIn,
                checkOut,
                nights,
                pricePerNight: room.pricePerNight,
              }))
            ),
        },
      },
      include: bookingInclude,
    });
    return booking;
  });
}

// ─── Read Bookings ────────────────────────────────────────────────

export async function getMyBookings(userId, { status, type, cursor, limit }) {
  const where = {
    userId,
    deletedAt: null,
    ...(status && { status }),
    ...(type && { type }),
  };

  return paginateBookings(where, cursor, limit);
}

export async function getManagedBookings(
  agentId,
  { status, type, cursor, limit }
) {
  const where = {
    assignedAgentId: agentId,
    deletedAt: null,
    ...(status && { status }),
    ...(type && { type }),
  };

  return paginateBookings(where, cursor, limit);
}

export async function getAllBookings({ status, type, cursor, limit }) {
  const where = {
    deletedAt: null,
    ...(status && { status }),
    ...(type && { type }),
  };

  return paginateBookings(where, cursor, limit);
}

export async function getBookingById(id, userId, userRole) {
  const booking = await prisma.booking.findFirst({
    where: { id, deletedAt: null },
    include: bookingInclude,
  });

  if (!booking) throw { status: 404, message: "Booking not found" };

  // users can only see their own bookings
  if (userRole === "USER" && booking.userId !== userId) {
    throw { status: 403, message: "Access denied" };
  }

  // agents can see bookings assigned to them
  if (
    userRole === "AGENT" &&
    booking.userId !== userId &&
    booking.assignedAgentId !== userId
  ) {
    throw { status: 403, message: "Access denied" };
  }

  return booking;
}

// ─── Booking Actions ──────────────────────────────────────────────

export async function cancelBooking(id, userId, userRole) {
  const booking = await assertBookingExists(id);

  // only owner, assigned agent, or admin can cancel
  if (userRole === "USER" && booking.userId !== userId)
    throw { status: 403, message: "Access denied" };

  if (booking.status === "CANCELLED") {
    throw { status: 400, message: "Booking is already cancelled" };
  }

  if (booking.status === "COMPLETED") {
    throw { status: 400, message: "Cannot cancel a completed booking" };
  }

  return prisma.booking.update({
    where: { id },
    data: { status: "CANCELLED", updatedAt: new Date() },
    include: bookingInclude,
  });
}

export async function markBookingPaid(id, paymentData) {
  const booking = await assertBookingExists(id);

  if (booking.status === "CANCELLED") {
    throw { status: 400, message: "Cannot mark a cancelled booking as paid" };
  }

  // prevent duplicate transaction IDs
  const existingPayment = await prisma.payment.findUnique({
    where: { transactionId: paymentData.transactionId },
  });
  if (existingPayment) {
    throw {
      status: 409,
      message: "A payment with this transaction ID already exists",
    };
  }

  return prisma.$transaction(async (tx) => {
    // create payment record
    await tx.payment.create({
      data: {
        bookingId: id,
        amount: paymentData.amount,
        gateway: paymentData.gateway,
        transactionId: paymentData.transactionId,
        status: "SUCCESS",
      },
    });

    // confirm the booking
    return tx.booking.update({
      where: { id },
      data: { status: "CONFIRMED", updatedAt: new Date() },
      include: bookingInclude,
    });
  });
}

export async function markBookingCompleted(id) {
  const booking = await assertBookingExists(id);

  if (booking.status !== "CONFIRMED") {
    throw {
      status: 400,
      message: "Only confirmed bookings can be marked as completed",
    };
  }

  return prisma.booking.update({
    where: { id },
    data: { status: "COMPLETED", updatedAt: new Date() },
    include: bookingInclude,
  });
}

export async function assignAgent(id, agentId) {
  await assertBookingExists(id);

  // verify the profile is actually an agent
  const agent = await prisma.profile.findUnique({ where: { id: agentId } });
  if (!agent) throw { status: 404, message: "Agent not found" };
  if (agent.role !== "AGENT") {
    throw { status: 400, message: "The selected user is not an agent" };
  }

  return prisma.booking.update({
    where: { id },
    data: { assignedAgentId: agentId, updatedAt: new Date() },
    include: bookingInclude,
  });
}

// ─── Pagination helper ────────────────────────────────────────────

async function paginateBookings(where, cursor, limit) {
  const bookings = await prisma.booking.findMany({
    where,
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    orderBy: { createdAt: "desc" },
    include: bookingInclude,
  });

  const hasNextPage = bookings.length > limit;
  const data = hasNextPage ? bookings.slice(0, -1) : bookings;
  const nextCursor = hasNextPage ? data[data.length - 1].id : null;

  return { data, nextCursor, hasNextPage };
}
