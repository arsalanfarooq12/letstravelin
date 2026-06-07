import * as bookingsService from "./bookings.service.js";
import {
  createBookingSchema,
  bookingQuerySchema,
  assignAgentSchema,
  markPaidSchema,
} from "./bookings.schema.js";

export async function createBooking(req, res, next) {
  try {
    const body = createBookingSchema.parse(req.body);
    const booking = await bookingsService.createBooking(req.user.id, body);
    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
}

export async function getMyBookings(req, res, next) {
  try {
    const query = bookingQuerySchema.parse(req.query);
    const result = await bookingsService.getMyBookings(req.user.id, query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getManagedBookings(req, res, next) {
  try {
    const query = bookingQuerySchema.parse(req.query);
    const result = await bookingsService.getManagedBookings(req.user.id, query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getAllBookings(req, res, next) {
  try {
    const query = bookingQuerySchema.parse(req.query);
    const result = await bookingsService.getAllBookings(query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getBookingById(req, res, next) {
  try {
    const booking = await bookingsService.getBookingById(
      req.params.id,
      req.user.id,
      req.user.role
    );
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
}

export async function cancelBooking(req, res, next) {
  try {
    const booking = await bookingsService.cancelBooking(
      req.params.id,
      req.user.id,
      req.user.role
    );
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
}

export async function markBookingPaid(req, res, next) {
  try {
    const body = markPaidSchema.parse(req.body);
    const booking = await bookingsService.markBookingPaid(req.params.id, body);
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
}

export async function markBookingCompleted(req, res, next) {
  try {
    const booking = await bookingsService.markBookingCompleted(req.params.id);
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
}

export async function assignAgent(req, res, next) {
  try {
    const { agentId } = assignAgentSchema.parse(req.body);
    const booking = await bookingsService.assignAgent(req.params.id, agentId);
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
}
