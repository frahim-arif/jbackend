import { Router } from "express";

import { Job } from "../models/Job.js";
import { Worker } from "../models/Worker.js";

import {
  createJobNotification,
} from "../services/notificationService.js";

import adminAuth from "../middleware/adminAuth.js";

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

      res.json({
        jobs,
      });
    } catch (e) {
      console.error("Error fetching jobs:", e);

      res.status(500).json({
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
        district,
        workType,
        postedByEmail,
        postedByPhone,

        // Employer ki location
        location,
      } = req.body;

      // =================================================
      // CREATE JOB
      // =================================================

      const job = await Job.create({
        title,
        description,
        amount,
        district,
        workType,
        postedByEmail,
        postedByPhone,

        // =================================================
        // IMPORTANT
        // Employer ki location database me save hogi
        // =================================================
        location: location || {},
      });

      console.log("=================================");
      console.log("NEW JOB CREATED");
      console.log("Job ID:", job._id);
      console.log("District:", district);
      console.log("Work Type:", workType);

      console.log("Job Location:", job.location);

      console.log("=================================");

      // =================================================
      // FIND MATCHING WORKERS
      // =================================================

      const workers = await Worker.find({
        district: district,
        workType: workType,
      });

      console.log(
        `🔔 Matching workers: ${workers.length}`
      );

      console.log(
        "Matching Workers:",
        workers.map((worker) => ({
          id: worker._id,
          name: worker.name,
          district: worker.district,
          workType: worker.workType,
        }))
      );

      // =================================================
      // CREATE NOTIFICATIONS
      // =================================================

      let notifiedWorkers = 0;

      for (const worker of workers) {
        console.log(
          "Creating notification for:",
          worker.name,
          worker._id
        );

        const notification =
          await createJobNotification(
            worker,
            job
          );

        if (notification) {
          notifiedWorkers++;

          console.log(
            "✅ Notification created:",
            notification._id
          );
        } else {
          console.log(
            "❌ Notification failed for:",
            worker.name
          );
        }
      }

      // =================================================
      // RESPONSE
      // =================================================

      res.json({
        success: true,

        message: "Job created successfully",

        job,

        notifiedWorkers,
      });

    } catch (e) {
      console.error(
        "Error creating job:",
        e
      );

      res.status(500).json({
        success: false,
        message: "Error creating job",
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
        const { id } = req.params;

        const deletedJob =
          await Job.findByIdAndDelete(id);

        if (!deletedJob) {
          return res.status(404).json({
            success: false,
            message: "Job not found",
          });
        }

        res.json({
          success: true,
          message: "Job deleted successfully",
        });

      } catch (e) {
        console.error(
          "Error deleting job:",
          e
        );

        res.status(500).json({
          success: false,
          message: "Error deleting job",
        });
      }
    }
  );

  return router;
}