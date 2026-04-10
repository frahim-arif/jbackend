import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  username: String,
  password: String, // hashed password
});

export const Admin = mongoose.model("Admin", adminSchema);
