const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Check for "users" or "User" collection (depends on mongoose pluralization)
    const collection = db.collection('users');
    const indexes = await collection.indexes();
    console.log('Current indexes on "users":', JSON.stringify(indexes, null, 2));
    
    const usernameIndex = indexes.find(idx => idx.key.username);
    if (usernameIndex) {
      console.log('Dropping "username" index...');
      await collection.dropIndex(usernameIndex.name);
      console.log('Dropped successfully.');
    } else {
      console.log('No "username" index found.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

run();
