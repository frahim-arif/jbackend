import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { Admin } from "../models/Admin.js";
import { Worker } from "../models/Worker.js";

import { adminAuth } from "../middleware/adminAuth.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "SECRET_KEY";

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

    const admin = await Admin.findOne({ username });

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
    console.error("ADMIN LOGIN ERROR:", error);

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

router.get("/me", adminAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      admin: {
        id: req.admin._id,
        username: req.admin.username,
        role: req.admin.role || "admin",
      },
    });
  } catch (error) {
    console.error("ADMIN ME ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// =====================================================
// ADMIN STATS
// GET /admin/stats
// =====================================================

router.get("/stats", adminAuth, async (req, res) => {
  try {
    const [
      totalWorkers,
      paidWorkers,
      pendingPayment,
      activeWorkers,
      pendingWorkers,
      blockedWorkers,
      upWorkers,
      noidaWorkers,
    ] = await Promise.all([
      Worker.countDocuments(),

      Worker.countDocuments({
        paymentStatus: "PAID",
      }),

      Worker.countDocuments({
        paymentStatus: "PENDING",
      }),

      Worker.countDocuments({
        status: "Active",
      }),

      Worker.countDocuments({
        status: "Pending",
      }),

      Worker.countDocuments({
        status: "Blocked",
      }),

      Worker.countDocuments({
        state: "Uttar Pradesh",
      }),

      Worker.countDocuments({
        state: "Uttar Pradesh",
        district: "Noida",
      }),
    ]);

    res.json({
      success: true,
      stats: {
        totalWorkers,
        paidWorkers,
        pendingPayment,
        activeWorkers,
        pendingWorkers,
        blockedWorkers,
        upWorkers,
        noidaWorkers,
      },
    });
  } catch (error) {
    console.error("ADMIN STATS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load statistics",
    });
  }
});

// =====================================================
// GET ALL WORKERS
//
// GET /admin/workers
//
// Filters:
// ?state=Uttar Pradesh
// ?district=Noida
// ?workType=Painter
// ?paymentStatus=PAID
// ?status=Active
// ?search=rajesh
// =====================================================

router.get("/workers", adminAuth, async (req, res) => {
  try {
    const {
      state,
      district,
      workType,
      paymentStatus,
      status,
      search,
    } = req.query;

    const filter = {};

    // -----------------------------------------------
    // STATE
    // -----------------------------------------------

    if (state) {
      filter.state = state.trim();
    }

    // -----------------------------------------------
    // DISTRICT
    // -----------------------------------------------

    if (district) {
      filter.district = district.trim();
    }

    // -----------------------------------------------
    // WORK TYPE
    // -----------------------------------------------

    if (workType) {
      filter.workType = workType.trim();
    }

    // -----------------------------------------------
    // PAYMENT STATUS
    // -----------------------------------------------

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus.toUpperCase();
    }

    // -----------------------------------------------
    // WORKER STATUS
    // -----------------------------------------------

    if (status) {
      filter.status = status;
    }

    // -----------------------------------------------
    // SEARCH
    // Name / Mobile / Worker ID
    // -----------------------------------------------

    if (search) {
      const searchText = search.trim();

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

      // MongoDB ObjectId search
      if (/^[0-9a-fA-F]{24}$/.test(searchText)) {
        searchConditions.push({
          _id: searchText,
        });
      }

      filter.$or = searchConditions;
    }

    const workers = await Worker.find(filter)
      .select(
        "name mobile state district workType kycType kycNumber kycDocument status paymentStatus paymentAmount merchantOrderId paidAt createdAt"
      )
      .sort({
        createdAt: -1,
      });

    res.json({
      success: true,
      count: workers.length,
      filters: {
        state: state || null,
        district: district || null,
        workType: workType || null,
        paymentStatus: paymentStatus || null,
        status: status || null,
        search: search || null,
      },
      workers,
    });
  } catch (error) {
    console.error("ADMIN WORKERS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load workers",
    });
  }
});

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
      const worker = await Worker.findById(
        req.params.id
      );

      if (!worker) {
        return res.status(404).json({
          success: false,
          message: "Worker not found",
        });
      }

      res.json({
        success: true,
        worker,
      });
    } catch (error) {
      console.error(
        "ADMIN SINGLE WORKER ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Failed to load worker",
      });
    }
  }
);

// =====================================================
// UPDATE WORKER STATUS
//
// PATCH /admin/workers/:id/status
//
// Body:
// {
//   "status": "Active"
// }
//
// Allowed:
// Pending
// Active
// Blocked
// =====================================================

router.patch(
  "/workers/:id/status",
  adminAuth,
  async (req, res) => {
    try {
      const { status } = req.body;

      const allowedStatuses = [
        "Pending",
        "Active",
        "Blocked",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid status. Use Pending, Active or Blocked",
        });
      }

      const worker = await Worker.findByIdAndUpdate(
        req.params.id,
        {
          status,
        },
        {
          new: true,
        }
      );

      if (!worker) {
        return res.status(404).json({
          success: false,
          message: "Worker not found",
        });
      }

      res.json({
        success: true,
        message: `Worker status changed to ${status}`,
        worker,
      });
    } catch (error) {
      console.error(
        "ADMIN STATUS UPDATE ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Failed to update worker status",
      });
    }
  }
);

export default router;