const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function verifyIndexNotUnique() {
  try {
    console.log('=== Verifying Index Field Configuration ===\n');

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('diplomas');

    console.log('Step 1: Checking existing indexes...');
    const indexes = await collection.indexes();
    console.log('Current indexes on diplomas collection:');
    indexes.forEach(idx => {
      const uniqueStatus = idx.unique ? '⚠️  UNIQUE' : '✅ NOT UNIQUE';
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)} (${uniqueStatus})`);
    });
    console.log('');

    console.log('Step 2: Looking for unique constraints on "index" field...');
    const uniqueIndexOnIndexField = indexes.find(idx => {
      return idx.key && idx.key.index === 1 && idx.unique === true;
    });

    if (uniqueIndexOnIndexField) {
      console.log(`⚠️  WARNING: Found unique constraint: ${uniqueIndexOnIndexField.name}`);
      console.log('   This will prevent multiple diplomas per student index!');
      console.log('   Dropping constraint...');
      
      await collection.dropIndex(uniqueIndexOnIndexField.name);
      console.log('✅ Unique constraint dropped successfully\n');
    } else {
      console.log('✅ No unique constraint on "index" field - Good!\n');
    }

    console.log('Step 3: Ensuring compound index exists (for query performance)...');
    try {
      try {
        await collection.dropIndex('index_1_createdAt_-1');
      } catch (err) {
      }

      await collection.createIndex(
        { index: 1, createdAt: -1 },
        { unique: false, name: 'index_1_createdAt_-1' }
      );
      console.log('✅ Compound index created (non-unique)\n');
    } catch (err) {
      console.log('ℹ️  Compound index already exists or creation failed:', err.message, '\n');
    }

    console.log('Step 4: Testing duplicate index insertion...');
    const testIndex = `TEST_${Date.now()}`;
    
    try {
      await collection.insertOne({
        studentName: "Test Student 1",
        index: testIndex,
        tokenId: `test1_${Date.now()}`,
        valid: true,
        createdAt: new Date()
      });
      console.log(`✅ First diploma inserted with index: ${testIndex}`);

      await collection.insertOne({
        studentName: "Test Student 2",
        index: testIndex, 
        tokenId: `test2_${Date.now()}`,
        valid: true,
        createdAt: new Date()
      });
      console.log(`✅ Second diploma inserted with SAME index: ${testIndex}`);
      console.log('✅ Duplicate index insertion SUCCESSFUL!\n');

      await collection.deleteMany({ index: testIndex });
      console.log('✅ Test data cleaned up\n');
    } catch (err) {
      console.error('❌ Error inserting duplicate index:', err.message);
      console.error('   This means unique constraint still exists!\n');
      await collection.deleteMany({ index: testIndex });
    }

    console.log('Step 5: Final index configuration:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)} (unique: ${idx.unique || false})`);
    });
    console.log('');

    console.log('=== Summary ===');
    const hasUniqueOnIndex = finalIndexes.some(idx => 
      idx.key && idx.key.index === 1 && idx.unique === true
    );

    if (hasUniqueOnIndex) {
      console.log('❌ PROBLEM: Index field has unique constraint');
      console.log('   Multiple diplomas per student index will FAIL');
      console.log('   Run this script again or manually drop the index\n');
    } else {
      console.log('✅ SUCCESS: Index field does NOT have unique constraint');
      console.log('✅ Multiple diplomas per student index are ALLOWED');
      console.log('✅ Database is configured correctly\n');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

verifyIndexNotUnique();

