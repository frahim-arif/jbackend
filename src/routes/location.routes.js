import { Router } from "express";
import locations from "../data/locations.json" with { type: "json" };

export function createLocationRouter() {
  const router = Router();

  // =====================================================
  // GET ALL STATES
  // =====================================================

  router.get("/states", (req, res) => {
    try {
      const states = Object.keys(locations).sort();

      res.json({
        success: true,
        states,
      });
    } catch (error) {
      console.error("States Error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to load states",
      });
    }
  });

  // =====================================================
  // GET DISTRICTS BY STATE
  // =====================================================

  router.get("/districts", (req, res) => {
    try {
      const { state } = req.query;

      if (!state) {
        return res.status(400).json({
          success: false,
          message: "State is required",
        });
      }

      const districts = locations[state];

      if (!districts) {
        return res.status(404).json({
          success: false,
          message: "State not found",
        });
      }

      res.json({
        success: true,
        state,
        districts: districts.sort(),
      });
    } catch (error) {
      console.error("District Error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to load districts",
      });
    }
  });

  return router;
}