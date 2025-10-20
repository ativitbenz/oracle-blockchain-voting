import express from 'express'
import * as transactionController from '../controllers/transactionController.js'

const router = express.Router()

// GET /api/blockchain/verify - Verify blockchain integrity
router.get('/verify', transactionController.verifyBlockchainIntegrity)

// GET /api/blockchain/metadata - Get blockchain metadata
router.get('/metadata', transactionController.getBlockchainMetadata)

export default router
