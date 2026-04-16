import express from 'express';
import { query } from '../config/db.js';

const router = express.Router();

router.get('/health', async (_req, res) => {
  await query('SELECT 1');
  res.json({ ok: true, service: 'forever-pos-backend', time: new Date().toISOString() });
});

export default router;
