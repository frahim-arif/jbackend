import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Admin } from "../models/Admin.js";

const router = express.Router();

// Admin Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const admin = await Admin.findOne({ username });
  if (!admin)
    return res.json({ success: false, message: "Invalid Username" });

  const match = await bcrypt.compare(password, admin.password);
  if (!match)
    return res.json({ success: false, message: "Wrong Password" });

  const token = jwt.sign(
    { id: admin._id },
    "SECRET_KEY",
    { expiresIn: "2d" }
  );

  return res.json({ success: true, token });
});

export default router;
