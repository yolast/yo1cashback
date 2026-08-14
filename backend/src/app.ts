import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import config from './config/index.js';
import routes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middlewares/error.js';
import { rateLimit } from './middlewares/rateLimit.js';
import { maintenanceMiddleware } from './middlewares/maintenance.js';

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: config.isProd ? config.corsOrigins : true,
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(morgan(config.isProd ? 'combined' : 'dev'));

app.use('/api', rateLimit({ windowMs: 60_000, max: 300 }), maintenanceMiddleware, routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
