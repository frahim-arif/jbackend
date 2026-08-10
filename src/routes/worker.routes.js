
const express = require("express");
const router = express.Router();

const multer = require("multer");
const path = require("path");

const {
  registerWorker,
  getWorkers,
  getWorkerById,
} = require("../controllers/worker.controller");


// ===============================
// Multer Configuration
// ===============================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },

  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});


const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/pdf",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Only JPG, JPEG, PNG and PDF files are allowed"),
      false
    );
  }
};


const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});


// ===============================
// Routes
// ===============================

// Register Worker
router.post(
  "/register",
  upload.single("kycDocument"),
  registerWorker
);

// Get All Workers
router.get("/", getWorkers);

// Get Worker By ID
router.get("/:id", getWorkerById);


module.exports = router;

