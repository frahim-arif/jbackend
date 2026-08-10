
import { Worker } from '../models/Worker.js'


// Register Worker
export async function registerWorker(req, res) {
  try {

    const {
      name,
      mobile,
      district,
      workType,
      kycType,
      kycNumber
    } = req.body


    // Required fields
    if (
      !name ||
      !mobile ||
      !district ||
      !workType ||
      !kycType ||
      !kycNumber
    ) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      })
    }


    // Check existing worker
    const existingWorker = await Worker.findOne({
      mobile
    })

    if (existingWorker) {
      return res.status(409).json({
        success: false,
        message: 'Worker with this mobile number already exists'
      })
    }


    // Uploaded document
    const kycDocument = req.file
      ? `/uploads/${req.file.filename}`
      : null


    const worker = await Worker.create({
      name,
      mobile,
      district,
      workType,
      kycType,
      kycNumber,
      kycDocument
    })


    return res.status(201).json({
      success: true,
      message: 'Worker registered successfully',
      worker
    })

  } catch (error) {

    console.error('Worker Registration Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    })
  }
}


// Get all workers
export async function getWorkers(req, res) {
  try {

    const workers = await Worker
      .find()
      .sort({ createdAt: -1 })


    return res.json({
      success: true,
      workers
    })

  } catch (error) {

    console.error('Get Workers Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
}


// Get single worker
export async function getWorkerById(req, res) {
  try {

    const worker = await Worker.findById(req.params.id)


    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      })
    }


    return res.json({
      success: true,
      worker
    })

  } catch (error) {

    console.error('Get Worker Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
}

