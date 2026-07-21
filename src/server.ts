import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from "cors";
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { authRouter } from './routes/auth.js';
import { customersRouter } from './routes/customers.js';
import { projectsRouter } from './routes/projects.js';



const app = express();
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.get('/api/health', (_req, res) => res.json({ status: 'ok', version: '0.3.0' }));
app.use('/api/auth', authRouter);
app.use('/api/customers', customersRouter);
app.use('/api/projects', projectsRouter);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');
app.use(express.static(root));
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(root, 'index.html'));
});
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); });
app.listen(Number(process.env.PORT || 3000), () => console.log(`BauWerk läuft auf http://localhost:${process.env.PORT || 3000}`));
