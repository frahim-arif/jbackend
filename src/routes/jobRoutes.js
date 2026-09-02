
import { Router } from "express";

import { Job } from "../models/Job.js";
import { Worker } from "../models/Worker.js";

import {
  createJobNotification,
} from "../services/notificationService.js";

export function createJobRouter() {
  const router = Router();

  // =====================================================
  // GET ALL JOBS
  // =====================================================

  router.get("/jobs", async (req, res) => {
    try {
      const jobs = await Job.find().sort({
        createdAt: -1,
      });

      return res.json({
        success: true,
        jobs,
      });
    } catch (e) {
      console.error(
        "Error fetching jobs:",
        e
      );

      return res.status(500).json({
        success: false,
        message: "Error fetching jobs",
      });
    }
  });

  // =====================================================
  // CREATE JOB
  // =====================================================

  router.post("/jobs", async (req, res) => {
    try {
      const {
        title,
        description,
        amount,

        state,
        district,

        workType,

        postedByEmail,
        postedByPhone,

        location,
      } = req.body;

      // =================================================
      // VALIDATION
      // =================================================

      if (!title?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Job title required",
        });
      }

      if (!state?.trim()) {
        return res.status(400).json({
          success: false,
          message: "State required",
        });
      }

      if (!district?.trim()) {
        return res.status(400).json({
          success: false,
          message: "District required",
        });
      }

      if (!workType?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Work type required",
        });
      }

      // =================================================
      // CREATE JOB
      // =================================================

      const job = await Job.create({
        title,
        description,
        amount,

        state,
        district,

        workType,

        postedByEmail,
        postedByPhone,

        location: {
          ...(location || {}),

          state:
            location?.state ||
            state,

          district:
            location?.district ||
            district,
        },
      });

      // =================================================
      // JOB CREATED LOG
      // =================================================

      console.log(
        "================================="
      );

      console.log(
        "NEW JOB CREATED"
      );

      console.log(
        "Job ID:",
        job._id
      );

      console.log(
        "State:",
        state
      );

      console.log(
        "District:",
        district
      );

      console.log(
        "Work Type:",
        workType
      );

      console.log(
        "Location:",
        job.location
      );

      console.log(
        "================================="
      );

      // =================================================
      // FIND MATCHING WORKERS
      // =================================================
      //
      // IMPORTANT:
      //
      // Only workers who:
      //
      // 1. Paid ₹250
      // 2. paymentStatus = PAID
      // 3. status = Active
      // 4. Same state
      // 5. Same district
      // 6. Same work type
      //
      // will receive the notification.
      //
      // =================================================

      const workers = await Worker.find({
        state: state,
        district: district,
        workType: workType,

        paymentStatus: "PAID",

        status: "Active",
      });

      console.log(
        `🔔 Paid + Active matching workers: ${workers.length}`
      );

      // =================================================
      // MATCHING WORKERS LOG
      // =================================================

      console.log(
        "Matching Paid Workers:",
        workers.map((worker) => ({
          id: worker._id,
          name: worker.name,
          state: worker.state,
          district: worker.district,
          workType: worker.workType,
          paymentStatus:
            worker.paymentStatus,
          status: worker.status,
        }))
      );

      // =================================================
      // CREATE NOTIFICATIONS
      // =================================================

      let notifiedWorkers = 0;

      for (const worker of workers) {
        try {
          const notification =
            await createJobNotification(
              worker,
              job
            );

          if (notification) {
            notifiedWorkers++;
          }
        } catch (notificationError) {
          console.error(
            `Notification failed for worker ${worker._id}:`,
            notificationError
          );
        }
      }

      // =================================================
      // RESPONSE
      // =================================================

      return res.json({
        success: true,

        message:
          "Job created successfully",

        job,

        matchedWorkers:
          workers.length,

        notifiedWorkers,
      });
    } catch (e) {
      console.error(
        "Error creating job:",
        e
      );

      return res.status(500).json({
        success: false,
        message:
          "Error creating job",
        error: e.message,
      });
    }
  });

  // =====================================================
  // DELETE JOB
  // =====================================================

  router.delete(
    "/jobs/:id",
    async (req, res) => {
      try {
        const deletedJob =
          await Job.findByIdAndDelete(
            req.params.id
          );

        if (!deletedJob) {
          return res.status(404).json({
            success: false,
            message: "Job not found",
          });
        }

        return res.json({
          success: true,
          message:
            "Job deleted successfully",
        });
      } catch (e) {
        console.error(
          "Error deleting job:",
          e
        );

        return res.status(500).json({
          success: false,
          message:
            "Error deleting job",
        });
      }
    }
  );

  return router;
}

