import dotenv from 'dotenv';
import app from './app.js';
import { connectToDatabase } from './config/database.js';
import { seedDatabase } from './seed/seedDatabase.js';

dotenv.config();

const PORT = Number(process.env.PORT ?? 8080);

async function startServer() {
  await connectToDatabase();
  await seedDatabase();

  app.listen(PORT, () => {
    console.log(`MindMate backend running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start backend.', error);
  process.exit(1);
});
