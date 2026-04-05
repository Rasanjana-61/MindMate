import mongoose from 'mongoose';

export async function connectToDatabase() {
  const databaseUrl = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/mindmate_db';

  mongoose.set('strictQuery', true);

  await mongoose.connect(databaseUrl, {
    serverSelectionTimeoutMS: 5000,
  });

  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
}
