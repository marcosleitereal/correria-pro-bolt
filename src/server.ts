import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import waRoutes from './routes/wa';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/wa', waRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  const maskedApiKey = process.env.GUPSHUP_API_KEY?.slice(0, 6) + "..." || "sk_****...";
  console.log(`[Server] WA server ready on port ${PORT} | key: ${maskedApiKey}`);
});
