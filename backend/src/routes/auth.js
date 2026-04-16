import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { env } from '../config/env.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: 'Thiếu tài khoản hoặc mật khẩu' });
  }

  const result = await query('SELECT * FROM users WHERE username = $1 AND is_active = true LIMIT 1', [username]);
  const user = result.rows[0];
  if (!user) return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' });

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role, fullName: user.full_name }, env.jwtSecret, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role, fullName: user.full_name } });
});

export default router;
