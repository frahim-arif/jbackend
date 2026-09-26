import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { Admin } from "./src/models/Admin.js";
import { env } from "./src/config/env.js";

dotenv.config();

const createDimapurAdmin = async () => {
  try {
    await mongoose.connect(env.mongoUri);

    console.log("MongoDB connected.");

    const username = "dimapuradmin";
    const password = "Dimapur@123";

    const existingAdmin = await Admin.findOne({ username });

    if (existingAdmin) {
      console.log("Dimapur admin already exists.");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      username,
      password: hashedPassword,
      role: "dimapur_admin",
      isActive: true,
    });

    console.log("=================================");
    console.log("DIMAPUR ADMIN CREATED");
    console.log("Username:", admin.username);
    console.log("Password:", password);
    console.log("Role:", admin.role);
    console.log("=================================");

    process.exit(0);
  } catch (error) {
    console.error("CREATE DIMAPUR ADMIN ERROR:", error);
    process.exit(1);
  }
};

createDimapurAdmin();