
import jwt from "jsonwebtoken";
// SIMPLE ADMIN AUTH MIDDLEWARE

export default function adminAuth(req, res, next) {
  const token = req.headers.authorization;

  // Very simple static token for now
  const ADMIN_TOKEN = "jobhir-admin-2025";

  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  next();
}

