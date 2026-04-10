import { Router } from "express"
import { Job } from "../models/Job.js"
import adminAuth from "../middleware/adminAuth.js"   // <-- ADD THIS

export function createJobRouter() {
  const router = Router()

  // GET all jobs
  router.get("/jobs", async (req, res) => {
    try {
      const jobs = await Job.find().sort({ createdAt: -1 })
      res.json({ jobs })
    } catch (e) {
      console.error("Error fetching jobs", e)
      res.status(500).send("Error fetching jobs")
    }
  })

  // POST a job (offer-job)
  router.post("/jobs", async (req, res) => {
    try {
      const { title, description, amount, district, postedByEmail, phoneNumber } = req.body
      const job = await Job.create({ title, description, amount, district, postedByEmail, phoneNumber })
      res.json({ job })
    } catch (e) {
      console.error("Error creating job", e)
      res.status(500).send("Error creating job")
    }
  })

  // DELETE a job by id (Token-free)
  router.delete("/jobs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deletedJob = await Job.findByIdAndDelete(id);
      if (!deletedJob) return res.status(404).json({ success: false, message: "Job not found" });
      res.json({ success: true, message: "Job deleted successfully" });
    } catch (e) {
      console.error("Error deleting job", e);
      res.status(500).json({ success: false, message: "Error deleting job" });
    }
  });
  return router
}
