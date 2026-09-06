import express from "express";
import bcrypt from "bcryptjs";
import { Admin } from "../models/Admin.js";

const router = express.Router();

router.get("/create-admin", async (req, res) => {
  try {
    const existingAdmin = await Admin.findOne({
      username: "admin",
    });

    if (existingAdmin) {
      return res.status(400).send("Admin already exists");
    }

    const hashed = await bcrypt.hash("admin123", 10);

    await Admin.create({
      username: "admin",
      password: hashed,
    });

    res.send("Admin Created Successfully");
  } catch (error) {
    console.error("CREATE ADMIN ERROR:", error);

    res.status(500).send("Failed to create admin");
  }
});

export default router;