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

  const uploadDir = 'uploads'

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

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

  const upload = multer({
    storage,

    limits: {
      fileSize: 5 * 1024 * 1024
    }
  })


  router.post(
    '/workers/register',
    upload.single('kycDocument'),
    registerWorker
  )


  router.get(
    '/workers',
    getWorkers
  )


  router.get(
    '/workers/:id',
    getWorkerById
  )


  return router
}