import express from 'express';
import { initiatePayment, checkPaymentStatus } from '../controllers/movieController.js';

const router = express.Router();

router.post('/requesttopay', initiatePayment);
router.get('/requesttopay/:requestId', checkPaymentStatus);

export default router;