import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { matchingRoutes } from './routes/matching';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matching', matchingRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/demo', (req, res) => {
  res.json({ 
    message: 'ビジネスマッチングAPI - デモモード',
    note: 'データベースが必要ですが、基本的なAPIエンドポイントは動作しています'
  });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    // データベース接続をスキップしてサーバーのみ起動
    console.log('Starting server in demo mode...');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Demo API: http://localhost:${PORT}/api/demo`);
      console.log('Note: Database connection required for full functionality');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();