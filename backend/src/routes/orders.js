import express from 'express';
import { query } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

export default function createOrdersRouter(io) {
  const router = express.Router();

  async function broadcastOrder(orderId) {
    const orderResult = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
    const itemsResult = await query('SELECT * FROM order_items WHERE order_id = $1 ORDER BY id', [orderId]);
    io.emit('order:updated', { ...orderResult.rows[0], items: itemsResult.rows });
  }

  router.get('/open', requireAuth, async (_req, res) => {
    const result = await query(`
      SELECT o.*,
      COALESCE(json_agg(oi.*) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.status = 'open'
      GROUP BY o.id
      ORDER BY o.opened_at DESC
    `);
    res.json(result.rows);
  });

  router.post('/', requireAuth, async (req, res) => {
    const { tableCode } = req.body || {};
    if (!tableCode) return res.status(400).json({ message: 'Thiếu bàn' });

    const existing = await query('SELECT * FROM orders WHERE table_code = $1 AND status = $2 LIMIT 1', [tableCode, 'open']);
    if (existing.rows[0]) return res.json(existing.rows[0]);

    const result = await query(
      'INSERT INTO orders (table_code, created_by) VALUES ($1,$2) RETURNING *',
      [tableCode, req.user.id]
    );
    await query('UPDATE tables SET status = $1 WHERE code = $2', ['serving', tableCode]);
    io.emit('table:status', { tableCode, status: 'serving' });
    res.status(201).json(result.rows[0]);
  });

  router.get('/:id', requireAuth, async (req, res) => {
    const orderId = Number(req.params.id);
    const orderResult = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (!orderResult.rows[0]) return res.status(404).json({ message: 'Không tìm thấy order' });
    const itemsResult = await query('SELECT * FROM order_items WHERE order_id = $1 ORDER BY id', [orderId]);
    res.json({ ...orderResult.rows[0], items: itemsResult.rows });
  });

  router.post('/:id/items', requireAuth, async (req, res) => {
    const orderId = Number(req.params.id);
    const { productId, qty = 1 } = req.body || {};
    const productResult = await query('SELECT * FROM products WHERE id = $1 AND is_active = true', [productId]);
    const product = productResult.rows[0];
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

    const existing = await query('SELECT * FROM order_items WHERE order_id = $1 AND product_id = $2 LIMIT 1', [orderId, productId]);
    if (existing.rows[0]) {
      const newQty = existing.rows[0].qty + Number(qty);
      const lineTotal = newQty * Number(product.price);
      await query('UPDATE order_items SET qty = $1, line_total = $2 WHERE id = $3', [newQty, lineTotal, existing.rows[0].id]);
    } else {
      await query(
        'INSERT INTO order_items (order_id, product_id, product_name, qty, unit_price, line_total) VALUES ($1,$2,$3,$4,$5,$6)',
        [orderId, product.id, product.name, qty, product.price, Number(qty) * Number(product.price)]
      );
    }

    const sumResult = await query('SELECT COALESCE(SUM(line_total), 0) AS subtotal FROM order_items WHERE order_id = $1', [orderId]);
    const subtotal = Number(sumResult.rows[0].subtotal || 0);
    await query('UPDATE orders SET subtotal = $1, total = $1 WHERE id = $2', [subtotal, orderId]);
    await broadcastOrder(orderId);
    res.json({ ok: true });
  });

  router.post('/:id/pay', requireAuth, async (req, res) => {
    const orderId = Number(req.params.id);
    const { paymentMethod = 'cash' } = req.body || {};
    const orderResult = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
    const order = orderResult.rows[0];
    if (!order) return res.status(404).json({ message: 'Không tìm thấy order' });

    await query(
      `UPDATE orders
       SET status = 'paid', payment_method = $1, paid_by = $2, paid_at = NOW()
       WHERE id = $3`,
      [paymentMethod, req.user.id, orderId]
    );
    await query('UPDATE tables SET status = $1 WHERE code = $2', ['empty', order.table_code]);
    await query('INSERT INTO audit_logs (user_id, action, details) VALUES ($1,$2,$3)', [req.user.id, 'PAY_ORDER', JSON.stringify({ orderId, tableCode: order.table_code, paymentMethod })]);

    io.emit('bill:paid', {
      orderId,
      tableCode: order.table_code,
      total: Number(order.total),
      paymentMethod,
      at: new Date().toISOString(),
      cashier: req.user.fullName,
    });
    io.emit('table:status', { tableCode: order.table_code, status: 'empty' });
    res.json({ ok: true });
  });

  return router;
}
