import * as transportService from "./transport.service.js";
import {
  createTransportSchema,
  updateTransportSchema,
  transportQuerySchema,
  validateBookingSchema,
} from "./transport.schema.js";

// ─── Transport ────────────────────────────────────────────────────

export async function getAllTransports(req, res, next) {
  try {
    const query = transportQuerySchema.parse(req.query);
    const result = await transportService.getAllTransports(query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getTransportById(req, res, next) {
  try {
    const transport = await transportService.getTransportById(req.params.id);
    res.status(200).json(transport);
  } catch (err) {
    next(err);
  }
}

export async function createTransport(req, res, next) {
  try {
    const body = createTransportSchema.parse(req.body);
    const transport = await transportService.createTransport(body);
    res.status(201).json(transport);
  } catch (err) {
    next(err);
  }
}

export async function updateTransport(req, res, next) {
  try {
    const body = updateTransportSchema.parse(req.body);
    const transport = await transportService.updateTransport(
      req.params.id,
      body
    );
    res.status(200).json(transport);
  } catch (err) {
    next(err);
  }
}

export async function deleteTransport(req, res, next) {
  try {
    await transportService.deleteTransport(req.params.id);
    res.status(200).json({ message: "Transport route deleted successfully" });
  } catch (err) {
    next(err);
  }
}

// ─── Availability ─────────────────────────────────────────────────

export async function getSeatAvailability(req, res, next) {
  try {
    const result = await transportService.getSeatAvailability(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// ─── Booking Validation ───────────────────────────────────────────

export async function validateBooking(req, res, next) {
  try {
    const body = validateBookingSchema.parse(req.body);
    const result = await transportService.validateBooking(req.user.id, body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
