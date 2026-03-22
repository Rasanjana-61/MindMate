import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import JournalEntry from './models/JournalEntry.model.js';

dotenv.config();

// Override system DNS servers
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI is missing in .env");
  process.exit(1);
}

const generateDummyData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB...");

    const userId = "testUser123";
    const emotionScores = new Map(Object.entries({
      anger: 0.9561396241188049,
      disgust: 0.0020454104524105787,
      fear: 0.03533485159277916,
      joy: 0,
      neutral: 0,
      sadness: 0.0015889783389866352,
      surprise: 0.002160728210583329
    }));

    const entries = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      // Add some random time to look realistic
      d.setHours(9 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60), 0, 0);

      entries.push({
        userId,
        entryDate: d,
        text: `Dummy entry for ${d.toDateString()}. Feeling quite frustrated today but pushing through it. Some days are just harder than others.`,
        moodScore: Math.floor(Math.random() * 5) + 1,
        stressScore: Math.floor(Math.random() * 5) + 1,
        energyScore: Math.floor(Math.random() * 5) + 1,
        emotion: "anger",
        emotionScores: emotionScores,
        sentiment: "Negative",
        summaryText: "User had a frustrating day but is coping.",
        suggestions: ["Take a deep breath and pause.", "Go for a short walk to clear your head.", "Consider talking to a friend."]
      });
    }

    // Insert dummy entries directly to database
    await JournalEntry.insertMany(entries);
    console.log("30 dummy entries for the last 30 days were successfully inserted!");

    mongoose.connection.close();
  } catch (err) {
    console.error("Error seeding data:", err);
    mongoose.connection.close();
  }
};

generateDummyData();
