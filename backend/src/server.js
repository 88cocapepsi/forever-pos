import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server } from 'socket.io';

import { env } from './config/env.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import productsRouter from './routes/products.js';
import tablesRouter from './routes/tables.js';
import createOrdersRouter from './routes/orders.js';
import reportsRouter from './routes/reports.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: env.corsOrigins,
    credentials: true,
  },
});

app.use(helmet());
app.use(cors({ origin: env.corsOrigins, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (_req, res) => {
  res.json({ service: 'FOREVER POS PRO API', ok: true });
});

app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/tables', tablesRouter);
app.use('/api/orders', createOrdersRouter(io));
app.use('/api/reports', reportsRouter);

io.on('connection', socket => {
  console.log('socket connected', socket.id);
  socket.on('disconnect', () => console.log('socket disconnected', socket.id));
});

server.listen(env.port, () => {
  console.log(`FOREVER POS backend listening on http://localhost:${env.port}`);
});
