
import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

import {
  registerWorker,
  getWorkers,
  getWorkerById
} from '../controllers/workerController.js'


export function createWorkerRouter() {

  const router = express.Router()


  // ==========================
  // Upload Folder
  // ==========================

  const uploadDir = 'uploads'

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }


  // ==========================
  // Multer Storage
  // ==========================

  const storage = multer.diskStorage({

    destination: (req, file, cb) => {
      cb(null, uploadDir)
    },

    filename: (req, file, cb) => {

      const uniqueName =
        Date.now() +
        '-' +
        Math.round(Math.random() * 1e9) +
        path.extname(file.originalname)

      cb(null, uniqueName)
    }

  })


  // ==========================
  // File Filter
  // ==========================

  const fileFilter = (req, file, cb) => {

    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/pdf'
    ]


    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(
        new Error('Only JPG, JPEG, PNG and PDF files are allowed')
      )
    }

  }


  const upload = multer({
    storage,
    fileFilter,

    limits: {
      fileSize: 5 * 1024 * 1024
    }
  })


  // ==========================
  // Routes
  // ==========================

  // Register Worker
  router.post(
    '/workers/register',
    upload.single('kycDocument'),
    registerWorker
  )


  // Get all workers
  router.get(
    '/workers',
    getWorkers
  )


  // Get worker by ID
  router.get(
    '/workers/:id',
    getWorkerById
  )


  return router
}

