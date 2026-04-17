import express from 'express';
import { query } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, async (_req, res) => {
  const result = await query('SELECT * FROM products WHERE is_active = true ORDER BY category, name');
  res.json(result.rows);
});

export default router;
