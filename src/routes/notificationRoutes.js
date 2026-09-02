import express from "express";

import { Notification } from "../models/Notification.js";
import { Worker } from "../models/Worker.js";

export function createNotificationRouter() {
  const router = express.Router();

  // =====================================================
  // CHECK WORKER ACCESS
  // =====================================================

  async function getActivePaidWorker(workerId) {
    try {
      return await Worker.findOne({
        _id: workerId,
        paymentStatus: "PAID",
        status: "Active",
      });
    } catch (error) {
      console.error(
        "Worker Access Check Error:",
        error.message
      );

      return null;
    }
  }

  // =====================================================
  // GET WORKER NOTIFICATIONS
  // =====================================================

  router.get(
    "/notifications/:workerId",
    async (req, res) => {
      try {
        const { workerId } = req.params;

        if (!workerId) {
          return res.status(400).json({
            success: false,
            message: "Worker ID required",
            notifications: [],
          });
        }

        const worker =
          await getActivePaidWorker(workerId);

        if (!worker) {
          return res.status(403).json({
            success: false,
            message:
              "Worker account is not active. Please complete the ₹250 registration payment.",
            notifications: [],
          });
        }

        const notifications =
          await Notification.find({
            workerId: worker._id,
          })
            .sort({
              createdAt: -1,
            })
            .lean();

        return res.json({
          success: true,
          notifications,
        });
      } catch (error) {
        console.error(
          "Get Notifications Error:",
          error
        );

        return res.status(500).json({
          success: false,
          message: "Unable to get notifications",
          notifications: [],
        });
      }
    }
  );

  // =====================================================
  // GET UNREAD COUNT
  // =====================================================

  router.get(
    "/notifications/:workerId/unread",
    async (req, res) => {
      try {
        const { workerId } = req.params;

        if (!workerId) {
          return res.status(400).json({
            success: false,
            count: 0,
            message: "Worker ID required",
          });
        }

        const worker =
          await getActivePaidWorker(workerId);

        if (!worker) {
          return res.status(403).json({
            success: false,
            count: 0,
            message:
              "Worker account is not active.",
          });
        }

        const count =
          await Notification.countDocuments({
            workerId: worker._id,
            isRead: false,
          });

        return res.json({
          success: true,
          count,
        });
      } catch (error) {
        console.error(
          "Unread Notification Error:",
          error
        );

        return res.status(500).json({
          success: false,
          count: 0,
          message:
            "Unable to get unread count",
        });
      }
    }
  );

  // =====================================================
  // MARK ONE NOTIFICATION AS READ
  // =====================================================

  router.put(
    "/notifications/:id/read",
    async (req, res) => {
      try {
        const { id } = req.params;

        const notification =
          await Notification.findById(id);

        if (!notification) {
          return res.status(404).json({
            success: false,
            message:
              "Notification not found",
          });
        }

        const worker =
          await getActivePaidWorker(
            notification.workerId
          );

        if (!worker) {
          return res.status(403).json({
            success: false,
            message:
              "Worker account is not active.",
          });
        }

        notification.isRead = true;

        await notification.save();

        return res.json({
          success: true,
          notification,
        });
      } catch (error) {
        console.error(
          "Mark Notification Read Error:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to update notification",
        });
      }
    }
  );

  // =====================================================
  // MARK ALL NOTIFICATIONS AS READ
  // =====================================================

  router.put(
    "/notifications/:workerId/read-all",
    async (req, res) => {
      try {
        const { workerId } = req.params;

        if (!workerId) {
          return res.status(400).json({
            success: false,
            message: "Worker ID required",
          });
        }

        const worker =
          await getActivePaidWorker(workerId);

        if (!worker) {
          return res.status(403).json({
            success: false,
            message:
              "Worker account is not active.",
          });
        }

        await Notification.updateMany(
          {
            workerId: worker._id,
            isRead: false,
          },
          {
            $set: {
              isRead: true,
            },
          }
        );

        return res.json({
          success: true,
          message:
            "All notifications marked as read",
        });
      } catch (error) {
        console.error(
          "Read All Notifications Error:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to update notifications",
        });
      }
    }
  );

  return router;
}