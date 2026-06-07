import { prisma } from "../../lib/prisma.js";

// ─── Helpers ──────────────────────────────────────────────────────

async function assertPackageExists(id) {
  const pkg = await prisma.package.findUnique({ where: { id } });
  if (!pkg) throw { status: 404, message: "Package not found" };
  return pkg;
}

// ─── Packages CRUD ────────────────────────────────────────────────

export async function getAllPackages({
  destinationId,
  search,
  minPrice,
  maxPrice,
  minDays,
  maxDays,
  cursor,
  limit,
}) {
  const where = {
    ...(destinationId && { destinationId }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...((minPrice || maxPrice) && {
      price: {
        ...(minPrice && { gte: minPrice }),
        ...(maxPrice && { lte: maxPrice }),
      },
    }),
    ...((minDays || maxDays) && {
      durationDays: {
        ...(minDays && { gte: minDays }),
        ...(maxDays && { lte: maxDays }),
      },
    }),
  };

  const packages = await prisma.package.findMany({
    where,
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    orderBy: { createdAt: "desc" },
    include: {
      destination: { select: { id: true, name: true, country: true } },
      creator: { select: { id: true, fullName: true } },
      packageItems: {
        include: {
          hotel: { select: { id: true, name: true, rating: true } },
          transport: {
            select: {
              id: true,
              type: true,
              schedule: true,
              price: true,
            },
          },
        },
      },
      _count: { select: { bookings: true } },
    },
  });

  const hasNextPage = packages.length > limit;
  const data = hasNextPage ? packages.slice(0, -1) : packages;
  const nextCursor = hasNextPage ? data[data.length - 1].id : null;

  return { data, nextCursor, hasNextPage };
}

export async function getPackageById(id) {
  const pkg = await prisma.package.findUnique({
    where: { id },
    include: {
      destination: true,
      creator: { select: { id: true, fullName: true, avatarUrl: true } },
      packageItems: {
        include: {
          hotel: {
            include: {
              rooms: true,
              destination: { select: { id: true, name: true } },
            },
          },
          transport: {
            include: {
              origin: { select: { id: true, name: true } },
              destination: { select: { id: true, name: true } },
            },
          },
        },
      },
      _count: { select: { bookings: true } },
    },
  });

  if (!pkg) throw { status: 404, message: "Package not found" };
  return pkg;
}

export async function createPackage(creatorId, data) {
  // verify destination exists
  const destination = await prisma.destination.findUnique({
    where: { id: data.destinationId },
  });
  if (!destination) throw { status: 404, message: "Destination not found" };

  return prisma.package.create({
    data: { ...data, createdByUserId: creatorId },
    include: { destination: true },
  });
}

export async function updatePackage(id, data) {
  await assertPackageExists(id);
  return prisma.package.update({
    where: { id },
    data,
    include: { destination: true, packageItems: true },
  });
}

export async function deletePackage(id) {
  const pkg = await assertPackageExists(id);

  // block delete if active bookings exist
  const activeBookings = await prisma.booking.count({
    where: {
      packageId: id,
      status: { notIn: ["CANCELLED"] },
    },
  });
  if (activeBookings > 0) {
    throw {
      status: 400,
      message: `Cannot delete a package with ${activeBookings} active booking(s)`,
    };
  }

  return prisma.package.delete({ where: { id } });
}

// ─── Package Items ────────────────────────────────────────────────

export async function addPackageItem(packageId, data) {
  await assertPackageExists(packageId);

  // verify the referenced hotel or transport exists
  if (data.itemType === "HOTEL") {
    const hotel = await prisma.hotel.findUnique({
      where: { id: data.hotelId },
    });
    if (!hotel) throw { status: 404, message: "Hotel not found" };

    // prevent duplicate hotel in same package
    const duplicate = await prisma.packageItem.findFirst({
      where: { packageId, hotelId: data.hotelId },
    });
    if (duplicate)
      throw { status: 409, message: "This hotel is already in the package" };
  }

  if (data.itemType === "TRANSPORT") {
    const transport = await prisma.transport.findUnique({
      where: { id: data.transportId },
    });
    if (!transport) throw { status: 404, message: "Transport route not found" };

    // prevent duplicate transport in same package
    const duplicate = await prisma.packageItem.findFirst({
      where: { packageId, transportId: data.transportId },
    });
    if (duplicate) {
      throw {
        status: 409,
        message: "This transport is already in the package",
      };
    }
  }

  return prisma.packageItem.create({
    data: { packageId, ...data },
    include: {
      hotel: { select: { id: true, name: true, rating: true } },
      transport: { select: { id: true, type: true, schedule: true } },
    },
  });
}

export async function removePackageItem(packageId, itemId) {
  await assertPackageExists(packageId);

  const item = await prisma.packageItem.findFirst({
    where: { id: itemId, packageId },
  });
  if (!item) throw { status: 404, message: "Package item not found" };

  return prisma.packageItem.delete({ where: { id: itemId } });
}

export async function getPackageItems(packageId) {
  await assertPackageExists(packageId);

  return prisma.packageItem.findMany({
    where: { packageId },
    include: {
      hotel: {
        include: {
          rooms: {
            select: {
              id: true,
              type: true,
              pricePerNight: true,
              totalRooms: true,
            },
          },
          destination: { select: { id: true, name: true } },
        },
      },
      transport: {
        include: {
          origin: { select: { id: true, name: true } },
          destination: { select: { id: true, name: true } },
          _count: { select: { bookings: true } },
        },
      },
    },
  });
}

// ─── Availability Validation ──────────────────────────────────────

export async function validatePackageAvailability(
  userId,
  { packageId, checkIn, checkOut, seats }
) {
  const pkg = await getPackageById(packageId);

  const nights = Math.ceil(
    (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
  );

  // check package duration matches requested nights
  if (nights !== pkg.durationDays) {
    throw {
      status: 400,
      message: `This package is designed for ${pkg.durationDays} night(s). Your selected dates span ${nights} night(s).`,
    };
  }

  // check user hasn't already booked this package
  const existingBooking = await prisma.booking.findFirst({
    where: {
      userId,
      packageId,
      status: { notIn: ["CANCELLED"] },
    },
  });
  if (existingBooking) {
    throw {
      status: 409,
      message: "You already have an active booking for this package",
    };
  }

  const itemResults = [];
  let allAvailable = true;

  for (const item of pkg.packageItems) {
    // ── Hotel item check ────────────────────────────────────────
    if (item.itemType === "HOTEL" && item.hotel) {
      const roomAvailability = await Promise.all(
        item.hotel.rooms.map(async (room) => {
          const bookedCount = await prisma.roomBooking.count({
            where: {
              roomId: room.id,
              booking: { status: { notIn: ["CANCELLED"] } },
              OR: [{ checkIn: { lt: checkOut }, checkOut: { gt: checkIn } }],
            },
          });
          const availableCount = room.totalRooms - bookedCount;
          return {
            roomId: room.id,
            type: room.type,
            pricePerNight: room.pricePerNight,
            availableCount,
            isAvailable: availableCount > 0,
          };
        })
      );

      const hotelAvailable = roomAvailability.some((r) => r.isAvailable);
      if (!hotelAvailable) allAvailable = false;

      itemResults.push({
        itemType: "HOTEL",
        hotelId: item.hotel.id,
        hotelName: item.hotel.name,
        isAvailable: hotelAvailable,
        rooms: roomAvailability,
      });
    }

    // ── Transport item check ────────────────────────────────────
    if (item.itemType === "TRANSPORT" && item.transport) {
      const bookedSeats = await prisma.booking.count({
        where: {
          transportId: item.transport.id,
          status: { notIn: ["CANCELLED"] },
        },
      });

      const availableSeats = item.transport.totalSeats - bookedSeats;
      const transportAvailable = availableSeats >= seats;

      // check transport schedule falls within the package dates
      const scheduleInRange =
        new Date(item.transport.schedule) >= new Date(checkIn) &&
        new Date(item.transport.schedule) <= new Date(checkOut);

      if (!transportAvailable || !scheduleInRange) allAvailable = false;

      itemResults.push({
        itemType: "TRANSPORT",
        transportId: item.transport.id,
        type: item.transport.type,
        schedule: item.transport.schedule,
        availableSeats,
        seatsRequested: seats,
        scheduleInRange,
        isAvailable: transportAvailable && scheduleInRange,
      });
    }
  }

  return {
    valid: allAvailable,
    packageId,
    packageTitle: pkg.title,
    destinationName: pkg.destination.name,
    checkIn,
    checkOut,
    nights,
    seats,
    packagePrice: pkg.price,
    totalPrice: Number(pkg.price) * seats,
    currency: "USD",
    items: itemResults,
    // highlight which items are blocking if not available
    blockers: itemResults
      .filter((i) => !i.isAvailable)
      .map((i) =>
        i.itemType === "HOTEL"
          ? `Hotel "${i.hotelName}" has no available rooms for selected dates`
          : `Transport ${i.type} on ${new Date(
              i.schedule
            ).toDateString()} is unavailable`
      ),
  };
}
