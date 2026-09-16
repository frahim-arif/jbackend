import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { Admin } from "../models/Admin.js";
import { Worker } from "../models/Worker.js";

import { adminAuth } from "../middleware/adminAuth.js";

const router = express.Router();

const JWT_SECRET =
  process.env.JWT_SECRET || "SECRET_KEY";

// =====================================================
// ADMIN LOGIN
// POST /admin/login
// =====================================================

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    const admin = await Admin.findOne({
      username: username.trim(),
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    if (admin.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Admin account is disabled",
      });
    }

    const match = await bcrypt.compare(
      password,
      admin.password
    );

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        username: admin.username,
        role: admin.role || "admin",
      },
      JWT_SECRET,
      {
        expiresIn: "2d",
      }
    );

    return res.json({
      success: true,
      message: "Admin login successful",
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role || "admin",
      },
    });
  } catch (error) {
    console.error(
      "ADMIN LOGIN ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// =====================================================
// ADMIN PROFILE
// GET /admin/me
// =====================================================

router.get(
  "/me",
  adminAuth,
  async (req, res) => {
    try {
      return res.json({
        success: true,
        admin: {
          id: req.admin._id,
          username: req.admin.username,
          role: req.admin.role || "admin",
        },
      });
    } catch (error) {
      console.error(
        "ADMIN ME ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// =====================================================
// ADMIN STATS
// GET /admin/stats
//
// GLOBAL STATS
// No state/district hard-coding
// =====================================================

router.get(
  "/stats",
  adminAuth,
  async (req, res) => {
    try {
      const [
        totalWorkers,
        paidWorkers,
        pendingPayment,
        failedPayment,

        activeWorkers,
        pendingWorkers,
        blockedWorkers,

        pendingVerification,
        underReview,
        verifiedWorkers,
        needMoreInformation,
        rejectedWorkers,

        expertWorkers,
        skilledWorkers,
        semiSkilledWorkers,
        helperWorkers,

        kycVerifiedWorkers,
        skillVerifiedWorkers,
      ] = await Promise.all([
        // ---------------------------------------------
        // WORKERS
        // ---------------------------------------------

        Worker.countDocuments(),

        // ---------------------------------------------
        // PAYMENT
        // ---------------------------------------------

        Worker.countDocuments({
          paymentStatus: "PAID",
        }),

        Worker.countDocuments({
          paymentStatus: "PENDING",
        }),

        Worker.countDocuments({
          paymentStatus: "FAILED",
        }),

        // ---------------------------------------------
        // ACCOUNT STATUS
        // ---------------------------------------------

        Worker.countDocuments({
          status: "Active",
        }),

        Worker.countDocuments({
          status: "Pending",
        }),

        Worker.countDocuments({
          status: "Blocked",
        }),

        // ---------------------------------------------
        // VERIFICATION
        // ---------------------------------------------

        Worker.countDocuments({
          verificationStatus: "Pending",
        }),

        Worker.countDocuments({
          verificationStatus: "Under Review",
        }),

        Worker.countDocuments({
          verificationStatus: "Verified",
        }),

        Worker.countDocuments({
          verificationStatus:
            "Need More Information",
        }),

        Worker.countDocuments({
          verificationStatus: "Rejected",
        }),

        // ---------------------------------------------
        // SKILL LEVEL
        // ---------------------------------------------

        Worker.countDocuments({
          skillLevel: "Expert",
        }),

        Worker.countDocuments({
          skillLevel: "Skilled",
        }),

        Worker.countDocuments({
          skillLevel: "Semi-Skilled",
        }),

        Worker.countDocuments({
          skillLevel: "Helper",
        }),

        // ---------------------------------------------
        // KYC / SKILL VERIFIED
        // ---------------------------------------------

        Worker.countDocuments({
          kycVerified: true,
        }),

        Worker.countDocuments({
          skillVerified: true,
        }),
      ]);

      return res.json({
        success: true,

        stats: {
          // Workers
          totalWorkers,

          // Payment
          paidWorkers,
          pendingPayment,
          failedPayment,

          // Account
          activeWorkers,
          pendingWorkers,
          blockedWorkers,

          // Verification
          pendingVerification,
          underReview,
          verifiedWorkers,
          needMoreInformation,
          rejectedWorkers,

          // Skills
          expertWorkers,
          skilledWorkers,
          semiSkilledWorkers,
          helperWorkers,

          // Verification checks
          kycVerifiedWorkers,
          skillVerifiedWorkers,
        },
      });
    } catch (error) {
      console.error(
        "ADMIN STATS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load statistics",
      });
    }
  }
);

// =====================================================
// GET ALL WORKERS
//
// GET /admin/workers
//
// Filters:
//
// state
// district
// workType
// paymentStatus
// status
// verificationStatus
// skillLevel
// search
// =====================================================

router.get(
  "/workers",
  adminAuth,
  async (req, res) => {
    try {
      const {
        state,
        district,
        workType,
        paymentStatus,
        status,
        verificationStatus,
        skillLevel,
        search,
      } = req.query;

      const filter = {};

      // ---------------------------------------------
      // STATE
      // ---------------------------------------------

      if (state?.trim()) {
        filter.state = state.trim();
      }

      // ---------------------------------------------
      // DISTRICT
      // ---------------------------------------------

      if (district?.trim()) {
        filter.district = district.trim();
      }

      // ---------------------------------------------
      // WORK TYPE
      // ---------------------------------------------

      if (workType?.trim()) {
        filter.workType = workType.trim();
      }

      // ---------------------------------------------
      // PAYMENT STATUS
      // ---------------------------------------------

      if (paymentStatus?.trim()) {
        filter.paymentStatus =
          paymentStatus.trim().toUpperCase();
      }

      // ---------------------------------------------
      // ACCOUNT STATUS
      // ---------------------------------------------

      if (status?.trim()) {
        filter.status = status.trim();
      }

      // ---------------------------------------------
      // VERIFICATION STATUS
      // ---------------------------------------------

      if (verificationStatus?.trim()) {
        filter.verificationStatus =
          verificationStatus.trim();
      }

      // ---------------------------------------------
      // SKILL LEVEL
      // ---------------------------------------------

      if (skillLevel?.trim()) {
        filter.skillLevel =
          skillLevel.trim();
      }

      // ---------------------------------------------
      // SEARCH
      // Name / Mobile / Worker ID
      // ---------------------------------------------

      if (search?.trim()) {
        const searchText =
          search.trim();

        const searchConditions = [
          {
            name: {
              $regex: searchText,
              $options: "i",
            },
          },
          {
            mobile: {
              $regex: searchText,
              $options: "i",
            },
          },
        ];

        if (
          /^[0-9a-fA-F]{24}$/.test(
            searchText
          )
        ) {
          searchConditions.push({
            _id: searchText,
          });
        }

        filter.$or =
          searchConditions;
      }

      const workers =
        await Worker.find(filter)
          .select(
            [
              "name",
              "mobile",
              "state",
              "district",
              "workType",

              "kycType",
              "kycNumber",
              "kycDocument",

              "status",

              "paymentStatus",
              "paymentAmount",
              "merchantOrderId",
              "paidAt",

              "verificationStatus",
              "skillLevel",
              "verificationScore",
              "experienceYears",
              "kycVerified",
              "skillVerified",
              "adminNotes",
              "verifiedAt",
              "verifiedBy",

              "createdAt",
              "updatedAt",
            ].join(" ")
          )
          .sort({
            createdAt: -1,
          });

      return res.json({
        success: true,
        count: workers.length,

        filters: {
          state: state || null,
          district: district || null,
          workType: workType || null,
          paymentStatus:
            paymentStatus || null,
          status: status || null,
          verificationStatus:
            verificationStatus || null,
          skillLevel:
            skillLevel || null,
          search: search || null,
        },

        workers,
      });
    } catch (error) {
      console.error(
        "ADMIN WORKERS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load workers",
      });
    }
  }
);

// =====================================================
// GET SINGLE WORKER
//
// GET /admin/workers/:id
// =====================================================

router.get(
  "/workers/:id",
  adminAuth,
  async (req, res) => {
    try {
      const worker =
        await Worker.findById(
          req.params.id
        );

      if (!worker) {
        return res.status(404).json({
          success: false,
          message:
            "Worker not found",
        });
      }

      return res.json({
        success: true,
        worker,
      });
    } catch (error) {
      console.error(
        "ADMIN SINGLE WORKER ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load worker",
      });
    }
  }
);

// =====================================================
// UPDATE WORKER ACCOUNT STATUS
//
// PATCH /admin/workers/:id/status
// =====================================================

router.patch(
  "/workers/:id/status",
  adminAuth,
  async (req, res) => {
    try {
      const { status } =
        req.body;

      const allowedStatuses = [
        "Pending",
        "Active",
        "Blocked",
      ];

      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid status. Use Pending, Active or Blocked",
        });
      }

      const worker =
        await Worker.findByIdAndUpdate(
          req.params.id,
          {
            $set: {
              status,
            },
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!worker) {
        return res.status(404).json({
          success: false,
          message:
            "Worker not found",
        });
      }

      return res.json({
        success: true,
        message:
          `Worker status changed to ${status}`,
        worker,
      });
    } catch (error) {
      console.error(
        "ADMIN STATUS UPDATE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update worker status",
      });
    }
  }
);

// =====================================================
// UPDATE WORKER VERIFICATION
//
// PATCH /admin/workers/:id/verification
// =====================================================

router.patch(
  "/workers/:id/verification",
  adminAuth,
  async (req, res) => {
    try {
      const {
        verificationStatus,
        skillLevel,
        verificationScore,
        experienceYears,
        kycVerified,
        skillVerified,
        adminNotes,
      } = req.body;

      // ---------------------------------------------
      // ALLOWED VALUES
      // ---------------------------------------------

      const allowedVerificationStatuses = [
        "Pending",
        "Under Review",
        "Verified",
        "Need More Information",
        "Rejected",
      ];

      const allowedSkillLevels = [
        "Expert",
        "Skilled",
        "Semi-Skilled",
        "Helper",
      ];

      // ---------------------------------------------
      // VALIDATE VERIFICATION STATUS
      // ---------------------------------------------

      if (
        verificationStatus !==
          undefined &&
        !allowedVerificationStatuses.includes(
          verificationStatus
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid verification status",
        });
      }

      // ---------------------------------------------
      // VALIDATE SKILL LEVEL
      // ---------------------------------------------

      if (
        skillLevel !==
          undefined &&
        skillLevel !== null &&
        !allowedSkillLevels.includes(
          skillLevel
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid skill level",
        });
      }

      // ---------------------------------------------
      // VALIDATE SCORE
      // ---------------------------------------------

      let score;

      if (
        verificationScore !==
        undefined
      ) {
        score =
          Number(
            verificationScore
          );

        if (
          Number.isNaN(score) ||
          score < 0 ||
          score > 100
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Verification score must be between 0 and 100",
          });
        }
      }

      // ---------------------------------------------
      // VALIDATE EXPERIENCE
      // ---------------------------------------------

      let experience;

      if (
        experienceYears !==
        undefined
      ) {
        experience =
          Number(
            experienceYears
          );

        if (
          Number.isNaN(
            experience
          ) ||
          experience < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Experience years must be 0 or greater",
          });
        }
      }

      // ---------------------------------------------
      // FIND WORKER
      // ---------------------------------------------

      const worker =
        await Worker.findById(
          req.params.id
        );

      if (!worker) {
        return res.status(404).json({
          success: false,
          message:
            "Worker not found",
        });
      }

      // ---------------------------------------------
      // BUILD UPDATE
      // ---------------------------------------------

      const updateData = {};

      if (
        verificationStatus !==
        undefined
      ) {
        updateData.verificationStatus =
          verificationStatus;
      }

      if (
        skillLevel !==
        undefined
      ) {
        updateData.skillLevel =
          skillLevel;
      }

      if (
        verificationScore !==
        undefined
      ) {
        updateData.verificationScore =
          score;
      }

      if (
        experienceYears !==
        undefined
      ) {
        updateData.experienceYears =
          experience;
      }

      if (
        kycVerified !==
        undefined
      ) {
        updateData.kycVerified =
          Boolean(
            kycVerified
          );
      }

      if (
        skillVerified !==
        undefined
      ) {
        updateData.skillVerified =
          Boolean(
            skillVerified
          );
      }

      if (
        adminNotes !==
        undefined
      ) {
        updateData.adminNotes =
          String(
            adminNotes
          ).trim();
      }

      // ---------------------------------------------
      // VERIFIED INFORMATION
      // ---------------------------------------------

      if (
        verificationStatus ===
        "Verified"
      ) {
        updateData.verifiedAt =
          new Date();

        updateData.verifiedBy =
          req.admin?.username ||
          "Admin";
      } else if (
        verificationStatus !==
        undefined
      ) {
        updateData.verifiedAt =
          null;

        updateData.verifiedBy =
          "";
      }

      // ---------------------------------------------
      // SAVE
      // ---------------------------------------------

      Object.assign(
        worker,
        updateData
      );

      await worker.save();

      return res.json({
        success: true,
        message:
          "Worker verification updated successfully",
        worker,
      });
    } catch (error) {
      console.error(
        "ADMIN VERIFICATION UPDATE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update worker verification",
      });
    }
  }
);

export default router;