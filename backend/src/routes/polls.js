import express from 'express'
import * as pollController from '../controllers/pollController.js'

const router = express.Router()

// GET /api/polls - Get all polls
router.get('/', pollController.getAllPolls)

// GET /api/polls/:id - Get single poll
router.get('/:id', pollController.getPollById)

// POST /api/polls - Create new poll
router.post('/', pollController.createPoll)

// GET /api/polls/:id/results - Get poll results
router.get('/:id/results', pollController.getPollResults)

// GET /api/polls/:id/recipients - Get poll recipients (for private polls)
router.get('/:id/recipients', pollController.getPollRecipients)

export default router
