import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { Admin } from "../models/Admin.js";
import { Worker } from "../models/Worker.js";

import { adminAuth } from "../middleware/adminAuth.js";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();

const JWT_SECRET =
  process.env.JWT_SECRET || "SECRET_KEY";


  const globalAdminOnly = (req, res, next) => {
  if (req.admin?.role === "dimapur_admin") {
    return res.status(403).json({
      success: false,
      message: "Global admin access only",
    });
  }

  next();
};

const dimapurAdminOnly = (req, res, next) => {
  if (req.admin?.role !== "dimapur_admin") {
    return res.status(403).json({
      success: false,
      message: "Dimapur admin access only",
    });
  }

  next();
};

// =====================================================
// HTML ESCAPE
// =====================================================

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// =====================================================
// ADMIN LOGIN
// POST /admin/login
// =====================================================

router.post("/login", async (req, res) => {
  try {
    const {
      username,
      password,
    } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Username and password are required",
      });
    }

    const admin =
      await Admin.findOne({
        username: username.trim(),
      });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid username or password",
      });
    }

    if (admin.isActive === false) {
      return res.status(403).json({
        success: false,
        message:
          "Admin account is disabled",
      });
    }

    const match =
      await bcrypt.compare(
        password,
        admin.password
      );

    if (!match) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid username or password",
      });
    }

    const token =
      jwt.sign(
        {
          id: admin._id,
          username: admin.username,
          role:
            admin.role ||
            "admin",
        },
        JWT_SECRET,
        {
          expiresIn: "2d",
        }
      );

    return res.json({
      success: true,
      message:
        "Admin login successful",
      token,
      admin: {
        id: admin._id,
        username:
          admin.username,
        role:
          admin.role ||
          "admin",
      },
    });
  } catch (error) {
    console.error(
      "ADMIN LOGIN ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error",
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
          id:
            req.admin._id,
          username:
            req.admin.username,
          role:
            req.admin.role ||
            "admin",
        },
      });
    } catch (error) {
      console.error(
        "ADMIN ME ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error",
      });
    }
  }
);

// =====================================================
// ADMIN STATS
// GET /admin/stats
// =====================================================

router.get(
  "/stats",
  adminAuth,
  globalAdminOnly,
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
      ] =
        await Promise.all([
          Worker.countDocuments(),

          Worker.countDocuments({
            paymentStatus:
              "PAID",
          }),

          Worker.countDocuments({
            paymentStatus:
              "PENDING",
          }),

          Worker.countDocuments({
            paymentStatus:
              "FAILED",
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
            verificationStatus:
              "Pending",
          }),

          Worker.countDocuments({
            verificationStatus:
              "Under Review",
          }),

          Worker.countDocuments({
            verificationStatus:
              "Verified",
          }),

          Worker.countDocuments({
            verificationStatus:
              "Need More Information",
          }),

          Worker.countDocuments({
            verificationStatus:
              "Rejected",
          }),

          Worker.countDocuments({
            skillLevel:
              "Expert",
          }),

          Worker.countDocuments({
            skillLevel:
              "Skilled",
          }),

          Worker.countDocuments({
            skillLevel:
              "Semi-Skilled",
          }),

          Worker.countDocuments({
            skillLevel:
              "Helper",
          }),

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
// GET /admin/workers
// =====================================================

router.get(
  "/workers",
  adminAuth,
  globalAdminOnly,
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

      if (state?.trim()) {
        filter.state =
          state.trim();
      }

      if (district?.trim()) {
        filter.district =
          district.trim();
      }

      if (workType?.trim()) {
        filter.workType =
          workType.trim();
      }

      if (
        paymentStatus?.trim()
      ) {
        filter.paymentStatus =
          paymentStatus
            .trim()
            .toUpperCase();
      }

      if (status?.trim()) {
        filter.status =
          status.trim();
      }

      if (
        verificationStatus?.trim()
      ) {
        filter.verificationStatus =
          verificationStatus.trim();
      }

      if (skillLevel?.trim()) {
        filter.skillLevel =
          skillLevel.trim();
      }

      if (search?.trim()) {
        const searchText =
          search.trim();

        const searchConditions =
          [
            {
              name: {
                $regex:
                  searchText,
                $options:
                  "i",
              },
            },
            {
              mobile: {
                $regex:
                  searchText,
                $options:
                  "i",
              },
            },
            {
              email: {
                $regex:
                  searchText,
                $options:
                  "i",
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
        await Worker.find(
          filter
        )
          .select(
            [
              "name",
              "mobile",
              "email",
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
        count:
          workers.length,

        filters: {
          state:
            state || null,
          district:
            district || null,
          workType:
            workType || null,
          paymentStatus:
            paymentStatus ||
            null,
          status:
            status || null,
          verificationStatus:
            verificationStatus ||
            null,
          skillLevel:
            skillLevel ||
            null,
          search:
            search || null,
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
// PATCH /admin/workers/:id/status
// =====================================================

router.patch(
  "/workers/:id/status",
  adminAuth,
  async (req, res) => {
    try {
      const {
        status,
      } = req.body;

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
            runValidators:
              true,
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

      // =================================================
      // ALLOWED VALUES
      // =================================================

      const allowedVerificationStatuses =
        [
          "Pending",
          "Under Review",
          "Verified",
          "Need More Information",
          "Rejected",
        ];

      const allowedSkillLevels =
        [
          "Expert",
          "Skilled",
          "Semi-Skilled",
          "Helper",
        ];

      // =================================================
      // VALIDATE STATUS
      // =================================================

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

      // =================================================
      // VALIDATE SKILL
      // =================================================

      if (
        skillLevel !==
          undefined &&
        skillLevel !== null &&
        skillLevel !== "" &&
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

      // =================================================
      // VALIDATE SCORE
      // =================================================

      let score;

      if (
        verificationScore !==
        undefined
      ) {
        score = Number(
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

      // =================================================
      // VALIDATE EXPERIENCE
      // =================================================

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

      // =================================================
      // FIND WORKER
      // =================================================

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

      // =================================================
      // BUILD UPDATE
      // =================================================

      if (
        verificationStatus !==
        undefined
      ) {
        worker.verificationStatus =
          verificationStatus;
      }

      if (
        skillLevel !==
        undefined
      ) {
        worker.skillLevel =
          skillLevel || null;
      }

      if (
        verificationScore !==
        undefined
      ) {
        worker.verificationScore =
          score;
      }

      if (
        experienceYears !==
        undefined
      ) {
        worker.experienceYears =
          experience;
      }

      if (
        kycVerified !==
        undefined
      ) {
        worker.kycVerified =
          Boolean(
            kycVerified
          );
      }

      if (
        skillVerified !==
        undefined
      ) {
        worker.skillVerified =
          Boolean(
            skillVerified
          );
      }

      if (
        adminNotes !==
        undefined
      ) {
        worker.adminNotes =
          String(
            adminNotes
          ).trim();
      }

      // =================================================
      // VERIFIED INFORMATION
      // =================================================

      if (
        verificationStatus ===
        "Verified"
      ) {
        worker.verifiedAt =
          new Date();

        worker.verifiedBy =
          req.admin?.username ||
          "Admin";
      } else if (
        verificationStatus !==
        undefined
      ) {
        worker.verifiedAt =
          null;

        worker.verifiedBy =
          "";
      }

      // =================================================
      // VERIFIED STATUS VALIDATION
      // =================================================
      // Verified worker ke liye skill level
      // assess hona zaroori hai.

      if (
        worker.verificationStatus ===
          "Verified" &&
        !worker.skillLevel
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please select a skill level before marking worker as Verified",
        });
      }

      // =================================================
      // SAVE DATABASE
      // =================================================

      await worker.save();

      // =================================================
      // SEND EMAIL
      // =================================================

      let emailSent = false;

      if (
        worker.email &&
        worker.email.trim()
      ) {
        try {
          const safeName =
            escapeHtml(
              worker.name ||
                "Worker"
            );

          const safeWorkType =
            escapeHtml(
              worker.workType ||
                "-"
            );

          const safeStatus =
            escapeHtml(
              worker.verificationStatus ||
                "-"
            );

          const safeSkill =
            escapeHtml(
              worker.skillLevel ||
                "Not Assessed"
            );

          const safeExperience =
            escapeHtml(
              worker.experienceYears ??
                0
            );

          const safeScore =
            escapeHtml(
              worker.verificationScore ??
                0
            );

          const safeAdminNotes =
            escapeHtml(
              worker.adminNotes ||
                ""
            );

          let subject =
            "JobHIR Worker Verification Update";

          let title =
            "Verification Status Updated";

          let message =
            "Your JobHIR worker verification status has been updated.";

          let statusColor =
            "#92400e";

          if (
            worker.verificationStatus ===
            "Verified"
          ) {
            subject =
              "Congratulations! Your JobHIR Profile is Verified";

            title =
              "Your Profile Has Been Verified";

            message =
              "Congratulations! Your JobHIR worker profile has been successfully verified by our admin team.";

            statusColor =
              "#166534";
          }

          if (
            worker.verificationStatus ===
            "Under Review"
          ) {
            subject =
              "JobHIR Verification Under Review";

            title =
              "Your Profile is Under Review";

            message =
              "Your JobHIR worker profile is currently under review. We will update you once the verification process is completed.";

            statusColor =
              "#1d4ed8";
          }

          if (
            worker.verificationStatus ===
            "Need More Information"
          ) {
            subject =
              "Action Required: JobHIR Verification";

            title =
              "More Information Required";

            message =
              "We need some additional information or documentation to complete your JobHIR worker verification.";

            statusColor =
              "#b45309";
          }

          if (
            worker.verificationStatus ===
            "Rejected"
          ) {
            subject =
              "JobHIR Verification Status Update";

            title =
              "Verification Not Approved";

            message =
              "Your JobHIR worker verification could not be approved at this time. Please review the admin note below.";

            statusColor =
              "#b91c1c";
          }

          if (
            worker.verificationStatus ===
            "Pending"
          ) {
            subject =
              "JobHIR Verification Status: Pending";

            title =
              "Verification Pending";

            message =
              "Your JobHIR worker verification is currently pending.";

            statusColor =
              "#6b7280";
          }

          const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f5f5f5;
  font-family:Arial,Helvetica,sans-serif;
">

  <div style="
    padding:30px 15px;
  ">

    <div style="
      max-width:620px;
      margin:0 auto;
      background:#ffffff;
      border:1px solid #e5e7eb;
      border-radius:10px;
      overflow:hidden;
    ">

      <div style="
        background:#111827;
        padding:22px;
        text-align:center;
      ">
        <h1 style="
          margin:0;
          color:#ffffff;
          font-size:26px;
        ">
          JobHIR
        </h1>
      </div>

      <div style="
        padding:30px;
      ">

        <h2 style="
          margin:0 0 12px;
          color:#111827;
        ">
          Hello ${safeName},
        </h2>

        <h3 style="
          margin:0 0 15px;
          color:${statusColor};
        ">
          ${escapeHtml(title)}
        </h3>

        <p style="
          color:#374151;
          font-size:15px;
          line-height:1.7;
        ">
          ${escapeHtml(message)}
        </p>

        <div style="
          margin:25px 0;
          padding:18px;
          background:#f9fafb;
          border:1px solid #e5e7eb;
          border-radius:8px;
        ">

          <p style="margin:8px 0;">
            <strong>Worker:</strong>
            ${safeName}
          </p>

          <p style="margin:8px 0;">
            <strong>Work Type:</strong>
            ${safeWorkType}
          </p>

          <p style="margin:8px 0;">
            <strong>Verification Status:</strong>
            ${safeStatus}
          </p>

          <p style="margin:8px 0;">
            <strong>Skill Level:</strong>
            ${safeSkill}
          </p>

          <p style="margin:8px 0;">
            <strong>Experience:</strong>
            ${safeExperience} years
          </p>

          <p style="margin:8px 0;">
            <strong>Verification Score:</strong>
            ${safeScore}/100
          </p>

          <p style="margin:8px 0;">
            <strong>KYC Verified:</strong>
            ${worker.kycVerified
              ? "Yes"
              : "No"}
          </p>

          <p style="margin:8px 0;">
            <strong>Skill Verified:</strong>
            ${worker.skillVerified
              ? "Yes"
              : "No"}
          </p>

        </div>

        ${
          safeAdminNotes
            ? `
              <div style="
                margin:20px 0;
                padding:18px;
                background:#fffbeb;
                border-left:4px solid #f59e0b;
              ">

                <strong style="
                  color:#92400e;
                ">
                  Admin Note
                </strong>

                <p style="
                  margin:8px 0 0;
                  color:#374151;
                  line-height:1.6;
                ">
                  ${safeAdminNotes}
                </p>

              </div>
            `
            : ""
        }

        <p style="
          color:#6b7280;
          font-size:14px;
          line-height:1.6;
        ">
          Please keep your JobHIR registration information
          up to date.
        </p>

        <p style="
          color:#374151;
          margin-top:25px;
        ">
          Regards,<br />
          <strong>JobHIR Team</strong>
        </p>

      </div>

      <div style="
        padding:18px;
        background:#f9fafb;
        text-align:center;
        color:#6b7280;
        font-size:12px;
      ">
        This is an automated email from JobHIR.
      </div>

    </div>

  </div>

</body>
</html>
`;

          await sendEmail({
            to: worker.email,
            subject,
            html,
          });

          emailSent = true;

          console.log(
            "VERIFICATION EMAIL SENT:",
            worker.email
          );
        } catch (emailError) {
          console.error(
            "VERIFICATION EMAIL ERROR:",
            emailError
          );
        }
      } else {
        console.log(
          "VERIFICATION EMAIL SKIPPED: Worker has no email"
        );
      }

      // =================================================
      // RESPONSE
      // =================================================

      return res.json({
        success: true,

        message:
          worker.verificationStatus ===
          "Verified"
            ? "Worker verified successfully"
            : "Worker verification updated successfully",

        emailSent,

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

router.get(
  "/dimapur/stats",
  adminAuth,
  dimapurAdminOnly,
  async (req, res) => {
    try {
      const filter = {
        state: "Nagaland",
        district: "Dimapur",
      };

      const [
        totalWorkers,
        activeWorkers,
        pendingWorkers,
        blockedWorkers,
        paidWorkers,
        pendingPayment,
        failedPayment,
        pendingVerification,
        underReview,
        verifiedWorkers,
        rejectedWorkers,
        expertWorkers,
        skilledWorkers,
        semiSkilledWorkers,
        helperWorkers,
        kycVerifiedWorkers,
        skillVerifiedWorkers,
      ] = await Promise.all([
        Worker.countDocuments(filter),

        Worker.countDocuments({
          ...filter,
          status: "Active",
        }),

        Worker.countDocuments({
          ...filter,
          status: "Pending",
        }),

        Worker.countDocuments({
          ...filter,
          status: "Blocked",
        }),

        Worker.countDocuments({
          ...filter,
          paymentStatus: "PAID",
        }),

        Worker.countDocuments({
          ...filter,
          paymentStatus: "PENDING",
        }),

        Worker.countDocuments({
          ...filter,
          paymentStatus: "FAILED",
        }),

        Worker.countDocuments({
          ...filter,
          verificationStatus: "Pending",
        }),

        Worker.countDocuments({
          ...filter,
          verificationStatus: "Under Review",
        }),

        Worker.countDocuments({
          ...filter,
          verificationStatus: "Verified",
        }),

        Worker.countDocuments({
          ...filter,
          verificationStatus: "Rejected",
        }),

        Worker.countDocuments({
          ...filter,
          skillLevel: "Expert",
        }),

        Worker.countDocuments({
          ...filter,
          skillLevel: "Skilled",
        }),

        Worker.countDocuments({
          ...filter,
          skillLevel: "Semi-Skilled",
        }),

        Worker.countDocuments({
          ...filter,
          skillLevel: "Helper",
        }),

        Worker.countDocuments({
          ...filter,
          kycVerified: true,
        }),

        Worker.countDocuments({
          ...filter,
          skillVerified: true,
        }),
      ]);

      return res.json({
        success: true,

        location: {
          state: "Nagaland",
          district: "Dimapur",
        },

        stats: {
          totalWorkers,
          activeWorkers,
          pendingWorkers,
          blockedWorkers,

          paidWorkers,
          pendingPayment,
          failedPayment,

          pendingVerification,
          underReview,
          verifiedWorkers,
          rejectedWorkers,

          expertWorkers,
          skilledWorkers,
          semiSkilledWorkers,
          helperWorkers,

          kycVerifiedWorkers,
          skillVerifiedWorkers,
        },
      });
    } catch (error) {
      console.error("DIMAPUR DASHBOARD ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to load Dimapur dashboard",
      });
    }
  }
);

router.get(
  "/dimapur/workers",
  adminAuth,
  dimapurAdminOnly,
  async (req, res) => {
    try {
      const {
        workType,
        paymentStatus,
        status,
        verificationStatus,
        skillLevel,
        search,
      } = req.query;

      const filter = {
        state: "Nagaland",
        district: "Dimapur",
      };

      if (workType?.trim()) {
        filter.workType = workType.trim();
      }

      if (paymentStatus?.trim()) {
        filter.paymentStatus = paymentStatus.trim().toUpperCase();
      }

      if (status?.trim()) {
        filter.status = status.trim();
      }

      if (verificationStatus?.trim()) {
        filter.verificationStatus = verificationStatus.trim();
      }

      if (skillLevel?.trim()) {
        filter.skillLevel = skillLevel.trim();
      }

      if (search?.trim()) {
        const searchText = search.trim();

        filter.$or = [
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
          {
            email: {
              $regex: searchText,
              $options: "i",
            },
          },
        ];
      }

      const workers = await Worker.find(filter)
        .select(
          [
            "name",
            "mobile",
            "email",
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

        location: {
          state: "Nagaland",
          district: "Dimapur",
        },

        count: workers.length,

        workers,
      });
    } catch (error) {
      console.error("DIMAPUR WORKERS ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to load Dimapur workers",
      });
    }
  }
);

export default router;