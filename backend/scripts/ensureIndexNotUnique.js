const mongoose = require('mongoose');
require('dotenv').config();

async function ensureIndexNotUnique() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('diplomas');

    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);

    const uniqueIndexOnIndex = indexes.find(idx => 
      idx.key && idx.key.index === 1 && idx.unique === true
    );

    if (uniqueIndexOnIndex) {
      console.log('⚠️  Found unique index on "index" field. Dropping it...');
      await collection.dropIndex(uniqueIndexOnIndex.name);
      console.log('✅ Unique index dropped successfully');
    } else {
      console.log('✅ No unique constraint on "index" field - OK');
    }

    try {
      await collection.createIndex(
        { index: 1, createdAt: -1 },
        { unique: false, name: 'index_createdAt_1' }
      );
      console.log('✅ Compound index (non-unique) created/verified');
    } catch (err) {
      if (err.code === 85) {
        console.log('⚠️  Index exists with different options. Dropping and recreating...');
        await collection.dropIndex('index_createdAt_1');
        await collection.createIndex(
          { index: 1, createdAt: -1 },
          { unique: false, name: 'index_createdAt_1' }
        );
        console.log('✅ Compound index recreated as non-unique');
      } else {
        throw err;
      }
    }

    const finalIndexes = await collection.indexes();
    console.log('\nFinal indexes:');
    finalIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)} (unique: ${idx.unique || false})`);
    });

    console.log('\n✅ Verification complete: index field can repeat (NOT unique)');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

ensureIndexNotUnique();

