import express from "express";

import { Notification } from "../models/Notification.js";

export function createNotificationRouter() {

  const router = express.Router();


  // ===============================
  // Get Worker Notifications
  // ===============================

  router.get(
    "/notifications/:workerId",
    async (req, res) => {

      try {

        const { workerId } = req.params;


        const notifications =
          await Notification
            .find({ workerId })
            .sort({ createdAt: -1 });


        res.json({
          success: true,
          notifications,
        });


      } catch (error) {

        console.error(
          "Get Notifications Error:",
          error
        );

        res.status(500).json({
          success: false,
          message: "Unable to get notifications",
        });

      }

    }
  );


  // ===============================
  // Get Unread Count
  // ===============================

  router.get(
    "/notifications/:workerId/unread",
    async (req, res) => {

      try {

        const { workerId } = req.params;


        const count =
          await Notification.countDocuments({
            workerId,
            isRead: false,
          });


        res.json({
          success: true,
          count,
        });


      } catch (error) {

        console.error(
          "Unread Notification Error:",
          error
        );

        res.status(500).json({
          success: false,
          message: "Unable to get unread count",
        });

      }

    }
  );


  // ===============================
  // Mark One Notification Read
  // ===============================

  router.put(
    "/notifications/:id/read",
    async (req, res) => {

      try {

        const notification =
          await Notification.findByIdAndUpdate(
            req.params.id,
            {
              isRead: true,
            },
            {
              new: true,
            }
          );


        if (!notification) {

          return res.status(404).json({
            success: false,
            message: "Notification not found",
          });

        }


        res.json({
          success: true,
          notification,
        });


      } catch (error) {

        console.error(
          "Mark Notification Read Error:",
          error
        );

        res.status(500).json({
          success: false,
          message: "Unable to update notification",
        });

      }

    }
  );


  // ===============================
  // Mark All Notifications Read
  // ===============================

  router.put(
    "/notifications/:workerId/read-all",
    async (req, res) => {

      try {

        await Notification.updateMany(
          {
            workerId: req.params.workerId,
            isRead: false,
          },
          {
            isRead: true,
          }
        );


        res.json({
          success: true,
          message: "All notifications marked as read",
        });


      } catch (error) {

        console.error(
          "Read All Notifications Error:",
          error
        );

        res.status(500).json({
          success: false,
          message: "Unable to update notifications",
        });

      }

    }
  );


  return router;
}