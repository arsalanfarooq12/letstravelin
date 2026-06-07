import * as packagesService from "./packages.service.js";
import {
  createPackageSchema,
  updatePackageSchema,
  packageQuerySchema,
  addPackageItemSchema,
  validatePackageSchema,
} from "./packages.schema.js";

// ─── Packages ─────────────────────────────────────────────────────

export async function getAllPackages(req, res, next) {
  try {
    const query = packageQuerySchema.parse(req.query);
    const result = await packagesService.getAllPackages(query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getPackageById(req, res, next) {
  try {
    const pkg = await packagesService.getPackageById(req.params.id);
    res.status(200).json(pkg);
  } catch (err) {
    next(err);
  }
}

export async function createPackage(req, res, next) {
  try {
    const body = createPackageSchema.parse(req.body);
    const pkg = await packagesService.createPackage(req.user.id, body);
    res.status(201).json(pkg);
  } catch (err) {
    next(err);
  }
}

export async function updatePackage(req, res, next) {
  try {
    const body = updatePackageSchema.parse(req.body);
    const pkg = await packagesService.updatePackage(req.params.id, body);
    res.status(200).json(pkg);
  } catch (err) {
    next(err);
  }
}

export async function deletePackage(req, res, next) {
  try {
    await packagesService.deletePackage(req.params.id);
    res.status(200).json({ message: "Package deleted successfully" });
  } catch (err) {
    next(err);
  }
}

// ─── Package Items ────────────────────────────────────────────────

export async function getPackageItems(req, res, next) {
  try {
    const items = await packagesService.getPackageItems(req.params.id);
    res.status(200).json(items);
  } catch (err) {
    next(err);
  }
}

export async function addPackageItem(req, res, next) {
  try {
    const body = addPackageItemSchema.parse(req.body);
    const item = await packagesService.addPackageItem(req.params.id, body);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

export async function removePackageItem(req, res, next) {
  try {
    await packagesService.removePackageItem(req.params.id, req.params.itemId);
    res.status(200).json({ message: "Item removed from package" });
  } catch (err) {
    next(err);
  }
}

// ─── Availability Validation ──────────────────────────────────────

export async function validatePackageAvailability(req, res, next) {
  try {
    const body = validatePackageSchema.parse(req.body);
    const result = await packagesService.validatePackageAvailability(
      req.user.id,
      body
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
