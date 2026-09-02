
import { randomUUID } from "crypto";
import { StandardCheckoutPayRequest } from "pg-sdk-node";

import { Worker } from "../models/Worker.js";
import { WorkerPayment } from "../models/WorkerPayment.js";

const WORKER_REGISTRATION_AMOUNT = 25000; // ₹250 in paise

export function makeWorkerPaymentController(client) {
  return {
    // =====================================================
    // CREATE ₹250 WORKER REGISTRATION PAYMENT
    // =====================================================

    async createWorkerPayment(req, res) {
      try {
        const { workerId } = req.body;

        if (!workerId) {
          return res.status(400).json({
            success: false,
            message: "Worker ID required",
          });
        }

        // -------------------------------------------------
        // FIND WORKER
        // -------------------------------------------------

        const worker = await Worker.findById(workerId);

        if (!worker) {
          return res.status(404).json({
            success: false,
            message: "Worker not found",
          });
        }

        // -------------------------------------------------
        // ALREADY PAID
        // -------------------------------------------------

        if (worker.paymentStatus === "PAID") {
          return res.status(400).json({
            success: false,
            message:
              "Worker registration payment is already completed.",
          });
        }

        // -------------------------------------------------
        // CREATE UNIQUE MERCHANT ORDER ID
        // -------------------------------------------------

        const merchantOrderId =
          `WORKER_${randomUUID()}`;

        // -------------------------------------------------
        // SAVE PAYMENT
        // -------------------------------------------------

        await WorkerPayment.create({
          merchantOrderId,
          workerId: worker._id,
          amount: WORKER_REGISTRATION_AMOUNT,
          mobileNumber: worker.mobile,
          customerName: worker.name,
          status: "PENDING",
        });

        // -------------------------------------------------
        // SAVE ORDER ID IN WORKER
        // -------------------------------------------------

        worker.merchantOrderId =
          merchantOrderId;

        worker.paymentAmount =
          WORKER_REGISTRATION_AMOUNT;

        worker.paymentStatus =
          "PENDING";

        worker.status =
          "Pending";

        await worker.save();

        // -------------------------------------------------
        // PHONEPE CALLBACK
        // -------------------------------------------------

        const statusCallback =
          `https://jbackend-h963.onrender.com/worker-payment/check-status?merchantOrderId=${encodeURIComponent(
            merchantOrderId
          )}`;

        // -------------------------------------------------
        // PHONEPE REQUEST
        // -------------------------------------------------

        const request =
          StandardCheckoutPayRequest
            .builder()
            .merchantOrderId(
              merchantOrderId
            )
            .amount(
              WORKER_REGISTRATION_AMOUNT
            )
            .redirectUrl(
              statusCallback
            )
            .build();

        const response =
          await client.pay(request);

        if (!response?.redirectUrl) {
          return res.status(500).json({
            success: false,
            message:
              "PhonePe checkout URL not received",
          });
        }

        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.status(200).json({
          success: true,
          checkoutPageUrl:
            response.redirectUrl,
          merchantOrderId,
        });
      } catch (error) {
        console.error(
          "Worker Payment Create Error:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to create worker payment",
        });
      }
    },

    // =====================================================
    // CHECK WORKER PAYMENT STATUS
    // =====================================================

    async checkWorkerPaymentStatus(req, res) {
      try {
        const { merchantOrderId } =
          req.query;

        if (!merchantOrderId) {
          return res
            .status(400)
            .send("MerchantOrderId required");
        }

        // -------------------------------------------------
        // FIND PAYMENT FIRST
        // -------------------------------------------------

        const payment =
          await WorkerPayment.findOne({
            merchantOrderId,
          });

        if (!payment) {
          return res
            .status(404)
            .send("Worker payment not found");
        }

        // -------------------------------------------------
        // GET STATUS FROM PHONEPE
        // -------------------------------------------------

        const response =
          await client.getOrderStatus(
            merchantOrderId
          );

        const status =
          response?.state;

        console.log(
          "Worker PhonePe Payment Status:",
          {
            merchantOrderId,
            status,
            amount: response?.amount,
          }
        );

        // -------------------------------------------------
        // UPDATE PAYMENT STATUS
        // -------------------------------------------------

        payment.status =
          status || "PENDING";

        payment.lastWebhook =
          response;

        // =================================================
        // PAYMENT COMPLETED
        // =================================================

        if (status === "COMPLETED") {
          // ------------------------------------------------
          // IMPORTANT:
          // Verify amount is exactly ₹250
          // ------------------------------------------------

          if (
            response?.amount !==
            WORKER_REGISTRATION_AMOUNT
          ) {
            console.error(
              "❌ Worker payment amount mismatch:",
              response?.amount
            );

            payment.status =
              "FAILED";

            await payment.save();

            return res.redirect(
              `${process.env.FRONTEND_URL}/worker-payment-failure?merchantOrderId=${encodeURIComponent(
                merchantOrderId
              )}`
            );
          }

          // ------------------------------------------------
          // FIND WORKER
          // ------------------------------------------------

          const worker =
            await Worker.findById(
              payment.workerId
            );

          if (!worker) {
            payment.status =
              "FAILED";

            await payment.save();

            return res
              .status(404)
              .send("Worker not found");
          }

          // ------------------------------------------------
          // ACTIVATE WORKER
          // ------------------------------------------------

          worker.paymentStatus =
            "PAID";

          worker.paymentAmount =
            WORKER_REGISTRATION_AMOUNT;

          worker.status =
            "Active";

          worker.paidAt =
            worker.paidAt ||
            new Date();

          worker.merchantOrderId =
            merchantOrderId;

          await worker.save();

          // ------------------------------------------------
          // UPDATE PAYMENT
          // ------------------------------------------------

          payment.status =
            "COMPLETED";

          payment.transactionId =
            response.transactionId ||
            null;

          payment.paidAt =
            payment.paidAt ||
            new Date();

          payment.lastWebhook =
            response;

          await payment.save();

          console.log(
            "✅ Worker payment completed:",
            worker._id
          );
        }

        // =================================================
        // PAYMENT FAILED
        // =================================================

        else if (
          status === "FAILED"
        ) {
          payment.status =
            "FAILED";

          await payment.save();

          // Worker ko Active nahi karna
          const worker =
            await Worker.findById(
              payment.workerId
            );

          if (worker) {
            worker.paymentStatus =
              "FAILED";

            worker.status =
              "Pending";

            await worker.save();
          }
        }

        // =================================================
        // PAYMENT PENDING
        // =================================================

        else {
          payment.status =
            "PENDING";

          await payment.save();
        }

        // =================================================
        // REDIRECT
        // =================================================

        const successUrl =
          `${process.env.FRONTEND_URL}/worker-payment-success?merchantOrderId=${encodeURIComponent(
            merchantOrderId
          )}`;

        const failureUrl =
          `${process.env.FRONTEND_URL}/worker-payment-failure?merchantOrderId=${encodeURIComponent(
            merchantOrderId
          )}`;

        return res.redirect(
          status === "COMPLETED"
            ? successUrl
            : failureUrl
        );
      } catch (error) {
        console.error(
          "Worker Payment Status Error:",
          error
        );

        return res
          .status(500)
          .send(
            "Unable to check payment status"
          );
      }
    },
  };
}

