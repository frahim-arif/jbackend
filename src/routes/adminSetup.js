import express from "express";
import bcrypt from "bcryptjs";
import { Admin } from "../models/Admin.js";

const router = express.Router();

router.get("/create-admin", async (req, res) => {
  const hashed = await bcrypt.hash("admin123", 10);

  await Admin.create({
    username: "admin",
    password: hashed
  });

  res.send("Admin Created Successfully");
});

export default router;
