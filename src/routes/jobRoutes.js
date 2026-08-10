import { Router } from "express";

import { Job } from "../models/Job.js";

import { Worker } from "../models/Worker.js";

import {
  createJobNotification,
} from "../services/notificationService.js";

import adminAuth from "../middleware/adminAuth.js";


export function createJobRouter() {

  const router = Router();


  // ===============================
  // GET ALL JOBS
  // ===============================

  router.get("/jobs", async (req, res) => {

    try {

      const jobs = await Job
        .find()
        .sort({
          createdAt: -1,
        });


      res.json({
        jobs,
      });


    } catch (e) {

      console.error(
        "Error fetching jobs",
        e
      );

      res.status(500).send(
        "Error fetching jobs"
      );

    }

  });


  // ===============================
  // CREATE JOB
  // ===============================

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
      } = req.body;


      // ===============================
      // Create Job
      // ===============================

      const job = await Job.create({

        title,

        description,

        amount,

        district,

        workType,

        postedByEmail,

        postedByPhone,

      });


      // ===============================
      // Find Matching Workers
      // ===============================

      const workers = await Worker.find({

        district: district,

        workType: workType,

      });


      console.log(
        `🔔 Matching workers: ${workers.length}`
      );


      // ===============================
      // Create Notifications
      // ===============================

      for (const worker of workers) {

        await createJobNotification(
          worker,
          job
        );

      }


      // ===============================
      // Response
      // ===============================

      res.json({

        success: true,

        message:
          "Job created successfully",

        job,

        notifiedWorkers:
          workers.length,

      });


    } catch (e) {

      console.error(
        "Error creating job",
        e
      );

      res.status(500).json({

        success: false,

        message:
          "Error creating job",

      });

    }

  });


  // ===============================
  // DELETE JOB
  // ===============================

  router.delete(
    "/jobs/:id",
    async (req, res) => {

      try {

        const { id } =
          req.params;


        const deletedJob =
          await Job.findByIdAndDelete(
            id
          );


        if (!deletedJob) {

          return res.status(404).json({

            success: false,

            message:
              "Job not found",

          });

        }


        res.json({

          success: true,

          message:
            "Job deleted successfully",

        });


      } catch (e) {

        console.error(
          "Error deleting job",
          e
        );

        res.status(500).json({

          success: false,

          message:
            "Error deleting job",

        });

      }

    }
  );


  return router;
}