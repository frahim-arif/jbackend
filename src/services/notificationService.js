
import { Notification } from "../models/Notification.js";


// ===============================
// Create Job Notification
// ===============================

export async function createJobNotification(worker, job) {

  try {

    // =====================================================
    // ONLY PAID + ACTIVE WORKERS CAN RECEIVE NOTIFICATION
    // =====================================================

    if (
      worker.paymentStatus !== "PAID" ||
      worker.status !== "Active"
    ) {

      console.log(
        `⛔ Notification skipped for worker: ${worker.name} - Payment/Status not active`
      );

      return null;
    }


    // =====================================================
    // CREATE NOTIFICATION
    // =====================================================

    const notification = await Notification.create({

      workerId: worker._id,

      jobId: job._id,

      title: "New Job Available",

      message:
        `${job.workType} job available in ${job.district}`,

    });


    console.log(
      `🔔 Notification created for worker: ${worker.name}`
    );


    return notification;


  } catch (error) {

    console.error(
      "Notification Create Error:",
      error.message
    );

    return null;
  }
}

