import * as destinationService from "./destinations.service.js";
import {
  createDestinationSchema,
  updateDestinationSchema,
  destinationQuerySchema,
  createReviewSchema,
} from "./destinations.schema.js";

// ─── Destinations ─────────────────────────────────────────────────

export async function getAllDestinations(req, res, next) {
  try {
    const query = destinationQuerySchema.parse(req.query);
    const result = await destinationService.getAllDestinations(query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getDestinationById(req, res, next) {
  try {
    const destination = await destinationService.getDestinationById(
      req.params.id
    );
    res.status(200).json(destination);
  } catch (err) {
    next(err);
  }
}

export async function createDestination(req, res, next) {
  try {
    const body = createDestinationSchema.parse(req.body);
    const destination = await destinationService.createDestination(body);
    res.status(201).json(destination);
  } catch (err) {
    next(err);
  }
}

export async function updateDestination(req, res, next) {
  try {
    const body = updateDestinationSchema.parse(req.body);
    const destination = await destinationService.updateDestination(
      req.params.id,
      body
    );
    res.status(200).json(destination);
  } catch (err) {
    next(err);
  }
}

export async function deleteDestination(req, res, next) {
  try {
    await destinationService.deleteDestination(req.params.id);
    res.status(200).json({ message: "Destination deleted successfully" });
  } catch (err) {
    next(err);
  }
}

// ─── Reviews ──────────────────────────────────────────────────────

export async function getDestinationReviews(req, res, next) {
  try {
    const reviews = await destinationService.getDestinationReviews(
      req.params.id
    );
    res.status(200).json(reviews);
  } catch (err) {
    next(err);
  }
}

export async function createReview(req, res, next) {
  try {
    const body = createReviewSchema.parse(req.body);
    const review = await destinationService.createReview(
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
    await destinationService.deleteReview(
      req.params.reviewId,
      req.user.id,
      req.user.role // passed from auth middleware
    );
    res.status(200).json({ message: "Review deleted" });
  } catch (err) {
    next(err);
  }
}
