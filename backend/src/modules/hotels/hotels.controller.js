import * as hotelService from "./hotels.service.js";
import {
  createHotelSchema,
  updateHotelSchema,
  hotelQuerySchema,
  createRoomSchema,
  updateRoomSchema,
  availabilityQuerySchema,
  createReviewSchema,
} from "./hotels.schema.js";

// ─── Hotels ───────────────────────────────────────────────────────

export async function getAllHotels(req, res, next) {
  try {
    const query = hotelQuerySchema.parse(req.query);
    const result = await hotelService.getAllHotels(query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getHotelById(req, res, next) {
  try {
    const hotel = await hotelService.getHotelById(req.params.id);
    res.status(200).json(hotel);
  } catch (err) {
    next(err);
  }
}

export async function createHotel(req, res, next) {
  try {
    const body = createHotelSchema.parse(req.body);
    const hotel = await hotelService.createHotel(body);
    res.status(201).json(hotel);
  } catch (err) {
    next(err);
  }
}

export async function updateHotel(req, res, next) {
  try {
    const body = updateHotelSchema.parse(req.body);
    const hotel = await hotelService.updateHotel(req.params.id, body);
    res.status(200).json(hotel);
  } catch (err) {
    next(err);
  }
}

export async function deleteHotel(req, res, next) {
  try {
    await hotelService.deleteHotel(req.params.id);
    res.status(200).json({ message: "Hotel deleted successfully" });
  } catch (err) {
    next(err);
  }
}

// ─── Rooms ────────────────────────────────────────────────────────

export async function getRoomsByHotel(req, res, next) {
  try {
    const rooms = await hotelService.getRoomsByHotel(req.params.id);
    res.status(200).json(rooms);
  } catch (err) {
    next(err);
  }
}

export async function createRoom(req, res, next) {
  try {
    const body = createRoomSchema.parse(req.body);
    const room = await hotelService.createRoom(req.params.id, body);
    res.status(201).json(room);
  } catch (err) {
    next(err);
  }
}

export async function updateRoom(req, res, next) {
  try {
    const body = updateRoomSchema.parse(req.body);
    const room = await hotelService.updateRoom(
      req.params.id,
      req.params.roomId,
      body
    );
    res.status(200).json(room);
  } catch (err) {
    next(err);
  }
}

export async function deleteRoom(req, res, next) {
  try {
    await hotelService.deleteRoom(req.params.id, req.params.roomId);
    res.status(200).json({ message: "Room deleted successfully" });
  } catch (err) {
    next(err);
  }
}

// ─── Availability ─────────────────────────────────────────────────

export async function checkHotelAvailability(req, res, next) {
  try {
    const query = availabilityQuerySchema.parse(req.query);
    const result = await hotelService.checkHotelAvailability(
      req.params.id,
      query
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function checkRoomAvailability(req, res, next) {
  try {
    const query = availabilityQuerySchema.parse(req.query);
    const result = await hotelService.checkRoomAvailability(
      req.params.id,
      req.params.roomId,
      query
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// ─── Reviews ──────────────────────────────────────────────────────

export async function getHotelReviews(req, res, next) {
  try {
    const reviews = await hotelService.getHotelReviews(req.params.id);
    res.status(200).json(reviews);
  } catch (err) {
    next(err);
  }
}

export async function createReview(req, res, next) {
  try {
    const body = createReviewSchema.parse(req.body);
    const review = await hotelService.createReview(
      req.params.id,
      req.user.id,
      body
    );
    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
}

export async function deleteReview(req, res, next) {
  try {
    await hotelService.deleteReview(
      req.params.reviewId,
      req.user.id,
      req.user.role
    );
    res.status(200).json({ message: "Review deleted" });
  } catch (err) {
    next(err);
  }
}
