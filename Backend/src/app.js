import express from 'express';
import cors from 'cors';
import taskRoutes from './routes/taskRoutes.js';
import focusRoutes from './routes/focusRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandlers.js';

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS blocked for this origin.'));
    },
  })
);
app.use(express.json());

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.use('/api/tasks', taskRoutes);
app.use('/api/focus', focusRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
