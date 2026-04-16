import express from 'express';
import { query } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/summary', requireAuth, async (_req, res) => {
  const daily = await query(`
    SELECT
      COUNT(*) FILTER (WHERE status = 'paid' AND DATE(paid_at) = CURRENT_DATE) AS paid_bills_today,
      COALESCE(SUM(total) FILTER (WHERE status = 'paid' AND DATE(paid_at) = CURRENT_DATE), 0) AS revenue_today,
      COALESCE(SUM(total) FILTER (WHERE status = 'paid' AND DATE_TRUNC('month', paid_at) = DATE_TRUNC('month', CURRENT_DATE)), 0) AS revenue_month
    FROM orders
  `);
  res.json(daily.rows[0]);
});

export default router;
