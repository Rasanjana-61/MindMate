import mongoose from 'mongoose';

let databaseConnected = false;

export function isDatabaseConnected() {
  return databaseConnected;
}

export async function connectToDatabase() {
  const databaseUrl = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/mindmate_db';

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(databaseUrl, {
      serverSelectionTimeoutMS: 3000,
    });
    databaseConnected = true;
  } catch (error) {
    databaseConnected = false;

    if (process.env.MONGODB_REQUIRED === 'true') {
      throw error;
    }

    console.warn(`MongoDB unavailable (${error.message}). Using in-memory data for this session.`);
  }
}
